"use client";

/**
 * Die 3D-Darstellung der Doppelhelix.
 *
 * Drei Detailstufen aus derselben Geometrie:
 *   schema   – Stäbe und Kugeln, maximal übersichtlich
 *   molekuel – echte Ringformen, Zucker als Fünfeck, Basen als Ringe
 *   atome    – jedes Atom einzeln in CPK-Farben, wie im Molekülviewer
 *
 * Alles wird über wenige InstancedMeshes gezeichnet: Statt tausender
 * Einzelobjekte gibt es vier Zeichenaufrufe pro Bild. Das hält die Darstellung
 * auch im Atommodell auf dem iPad flüssig.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Base } from "@/lib/bio/genetics";
import { complement, isPurine } from "@/lib/bio/genetics";
import { BASE_COLORS } from "@/lib/bio/colors";
import {
  ELEMENT_COLORS,
  ELEMENT_RADIUS_A,
  RISE_A,
  SCALE,
  STRAND_OFFSET_RAD,
  SUGAR_RADIUS_A,
  TWIST_RAD,
  backbone,
  basePair,
  type PartKind,
} from "@/lib/bio/molecule";

const SENSE_BACKBONE = "#cbd5e1";
const ANTISENSE_BACKBONE = "#8496ad";
const NEW_STRAND = "#22d3ee";
const PROTOSPACER_COLOR = "#fb923c";
const PAM_COLOR = "#f472b6";
const HBOND_COLOR = "#cbd5e1";

const RISE = RISE_A * SCALE;
const RADIUS = SUGAR_RADIUS_A * SCALE;

export type HelixMode = "helix" | "replication";
export type HelixDetail = "schema" | "molekuel" | "atome";

/** Was beim Antippen getroffen wurde. */
export interface PartHit {
  index: number;
  strand: 1 | -1;
  part: PartKind;
  atomLabel: string;
  element: string | null;
}

export interface HelixProps {
  sequence: string;
  center: number;
  span: number;
  detail: HelixDetail;
  selected: number | null;
  protospacer: number[];
  editWindow: number[];
  pam: number[];
  predicted: number[];
  changed: number[];
  guideStrand: 1 | -1 | null;
  editorColor: string;
  enzymeBound: boolean;
  mode: HelixMode;
  showLabels: boolean;
  /** Beschriftet die Bauteile direkt im Bild („Was ist was?"). */
  showParts: boolean;
  flashToken: number;
  flashIndices: number[];
  onSelect: (index: number) => void;
  onPart: (hit: PartHit) => void;
  onCenterChange: (center: number) => void;
}

const MAX_SPHERES = 3600;
const MAX_BONDS = 3600;
const MAX_RINGS = 400;
const MAX_GLOW = 400;

function makeLetterTexture(text: string, color: string): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "rgba(2, 6, 23, 0.84)";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = "bold 70px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, size / 2, size / 2 + 4);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Beschriftungsschild, dessen Breite sich nach dem Text richtet. */
function makePlateTexture(text: string, color: string): { texture: THREE.Texture; aspect: number } {
  const height = 96;
  const fontSize = 46;
  const padding = 30;
  const measure = document.createElement("canvas").getContext("2d");
  if (measure) measure.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  const textWidth = measure ? measure.measureText(text).width : text.length * fontSize * 0.55;
  const width = Math.ceil(textWidth + padding * 2);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(2, 6, 23, 0.92)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(2, 2, width - 4, height - 4, 20);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, width / 2, height / 2 + 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { texture, aspect: width / height };
}

/** Die Beschriftungen des „Was ist was?"-Modus. */
const PART_LABELS = [
  { id: "backbone", text: "Zucker-Phosphat-Rückgrat", color: "#cbd5e1", at: 0.12 },
  { id: "phosphat", text: "Phosphat", color: "#fbbf24", at: 0.3 },
  { id: "zucker", text: "Zucker (Desoxyribose)", color: "#a5b4fc", at: 0.46 },
  { id: "base", text: "Base", color: "#4ade80", at: 0.62 },
  { id: "hbond", text: "Wasserstoffbrücken", color: "#e2e8f0", at: 0.8 },
  { id: "minor", text: "kleine Furche", color: "#94a3b8", at: -1 },
  { id: "major", text: "große Furche", color: "#94a3b8", at: -1 },
] as const;

export function HelixCanvas(props: HelixProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef(props);

  useEffect(() => {
    propsRef.current = props;
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    /* ---------------- Grundgerüst ---------------- */
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth || 640, mount.clientHeight || 480, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.9);
    key.position.set(7, 12, 14);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7dd3fc, 1.0);
    rim.position.set(-11, -5, -9);
    scene.add(rim);
    const warm = new THREE.PointLight(0xf0abfc, 0.6, 120);
    warm.position.set(0, 0, 18);
    scene.add(warm);

    const disposables: { dispose: () => void }[] = [];

    /* ---------------- Instanzierte Geometrie ---------------- */
    const sphereGeometry = new THREE.SphereGeometry(1, 16, 12);
    const bondGeometry = new THREE.CylinderGeometry(1, 1, 1, 10, 1, false);
    const hexGeometry = new THREE.CylinderGeometry(1, 1, 1, 6, 1, false);
    const pentGeometry = new THREE.CylinderGeometry(1, 1, 1, 5, 1, false);
    const glowGeometry = new THREE.SphereGeometry(1, 12, 8);
    disposables.push(sphereGeometry, bondGeometry, hexGeometry, pentGeometry, glowGeometry);

    const solidMaterial = () =>
      new THREE.MeshStandardMaterial({ roughness: 0.34, metalness: 0.16, flatShading: false });

    const atomMaterial = solidMaterial();
    const bondMaterial = solidMaterial();
    const ringMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.3,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const pentMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.3,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const glowMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    disposables.push(atomMaterial, bondMaterial, ringMaterial, pentMaterial, glowMaterial);

    const atomMesh = new THREE.InstancedMesh(sphereGeometry, atomMaterial, MAX_SPHERES);
    const bondMesh = new THREE.InstancedMesh(bondGeometry, bondMaterial, MAX_BONDS);
    const hexMesh = new THREE.InstancedMesh(hexGeometry, ringMaterial, MAX_RINGS);
    const pentMesh = new THREE.InstancedMesh(pentGeometry, pentMaterial, MAX_RINGS);
    const glowMesh = new THREE.InstancedMesh(glowGeometry, glowMaterial, MAX_GLOW);
    for (const mesh of [atomMesh, bondMesh, hexMesh, pentMesh, glowMesh]) {
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      scene.add(mesh);
    }

    /* ---------------- Beschriftungen ---------------- */
    const letterTextures = new Map<string, THREE.Texture>();
    const letterTexture = (letter: Base) => {
      const cached = letterTextures.get(letter);
      if (cached) return cached;
      const texture = makeLetterTexture(letter, BASE_COLORS[letter]);
      letterTextures.set(letter, texture);
      return texture;
    };
    (["A", "C", "G", "T"] as Base[]).forEach(letterTexture);

    const maxSpan = 41;
    const letterSprites: THREE.Sprite[] = [];
    for (let i = 0; i < maxSpan * 2; i++) {
      const material = new THREE.SpriteMaterial({
        map: letterTexture("A"),
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.setScalar(1.25);
      sprite.renderOrder = 6;
      sprite.visible = false;
      scene.add(sprite);
      letterSprites.push(sprite);
      disposables.push(material);
    }

    const PLATE_HEIGHT = 1.05;
    const partSprites = PART_LABELS.map((entry) => {
      const { texture, aspect } = makePlateTexture(entry.text, entry.color);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(PLATE_HEIGHT * aspect, PLATE_HEIGHT, 1);
      sprite.renderOrder = 8;
      sprite.visible = false;
      scene.add(sprite);
      disposables.push(material, texture);
      return sprite;
    });

    /* ---------------- Auswahlring und Enzym ---------------- */
    const ringGeometry = new THREE.TorusGeometry(1, 0.07, 8, 40);
    const selectionMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });
    const selectionRing = new THREE.Mesh(ringGeometry, selectionMaterial);
    selectionRing.visible = false;
    scene.add(selectionRing);
    disposables.push(ringGeometry, selectionMaterial);

    const enzyme = new THREE.Group();
    enzyme.visible = false;
    scene.add(enzyme);
    const casMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b9dff,
      transparent: true,
      opacity: 0.3,
      roughness: 0.22,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const lobeGeometry = new THREE.SphereGeometry(1, 26, 18);
    const lobeA = new THREE.Mesh(lobeGeometry, casMaterial);
    lobeA.scale.set(3.1, 3.9, 2.5);
    lobeA.position.set(2.2, 1.0, 0);
    const lobeB = new THREE.Mesh(lobeGeometry, casMaterial);
    lobeB.scale.set(2.4, 2.8, 2.0);
    lobeB.position.set(3.3, -2.6, 0.4);
    const deaminaseMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.75,
      roughness: 0.25,
    });
    const deaminase = new THREE.Mesh(lobeGeometry, deaminaseMaterial);
    deaminase.scale.setScalar(1.25);
    deaminase.position.set(1.3, 3.6, 0.6);
    const rnaMaterial = new THREE.MeshStandardMaterial({
      color: 0xfb923c,
      emissive: 0xea580c,
      emissiveIntensity: 0.3,
      roughness: 0.4,
    });
    const rnaGeometry = new THREE.TorusGeometry(1.7, 0.22, 10, 24);
    const rnaLoop = new THREE.Mesh(rnaGeometry, rnaMaterial);
    rnaLoop.position.set(3.4, 2.6, -0.4);
    rnaLoop.rotation.set(0.5, 0.4, 0);
    enzyme.add(lobeA, lobeB, deaminase, rnaLoop);
    disposables.push(casMaterial, lobeGeometry, deaminaseMaterial, rnaMaterial, rnaGeometry);

    /* ---------------- Kamera und Gesten ---------------- */
    const cameraState = { theta: 0, phi: 0.14, distance: 40, targetDistance: 40 };
    const pointers = new Map<number, { x: number; y: number }>();
    let dragStart: { x: number; y: number; time: number; moved: boolean } | null = null;
    let pinchStart: { distance: number; camera: number; midY: number; center: number } | null = null;

    const applyCamera = () => {
      const { theta, phi, distance } = cameraState;
      camera.position.set(
        Math.sin(theta) * Math.cos(phi) * distance,
        Math.sin(phi) * distance,
        Math.cos(theta) * Math.cos(phi) * distance,
      );
      camera.lookAt(0, 0, 0);
    };
    applyCamera();

    const canvas = renderer.domElement;
    const pointerDistance = () => {
      const list = [...pointers.values()];
      return list.length < 2 ? 0 : Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y);
    };
    const pointerMidY = () => {
      const list = [...pointers.values()];
      return list.length < 2 ? 0 : (list[0].y + list[1].y) / 2;
    };

    const onPointerDown = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 1) {
        dragStart = { x: event.clientX, y: event.clientY, time: performance.now(), moved: false };
      } else if (pointers.size === 2) {
        dragStart = null;
        pinchStart = {
          distance: pointerDistance(),
          camera: cameraState.targetDistance,
          midY: pointerMidY(),
          center: propsRef.current.center,
        };
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const previous = pointers.get(event.pointerId);
      if (!previous) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.size === 1 && dragStart) {
        const dx = event.clientX - previous.x;
        const dy = event.clientY - previous.y;
        if (Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y) > 8) {
          dragStart.moved = true;
        }
        cameraState.theta -= dx * 0.007;
        cameraState.phi = Math.max(-1.1, Math.min(1.1, cameraState.phi + dy * 0.005));
        applyCamera();
        return;
      }

      if (pointers.size >= 2 && pinchStart) {
        const distance = pointerDistance();
        if (pinchStart.distance > 0 && distance > 0) {
          cameraState.targetDistance = Math.max(
            12,
            Math.min(80, pinchStart.camera * (pinchStart.distance / distance)),
          );
        }
        const steps = Math.round((pointerMidY() - pinchStart.midY) / 22);
        const next = pinchStart.center + steps;
        if (next !== propsRef.current.center) propsRef.current.onCenterChange(next);
      }
    };

    const raycaster = new THREE.Raycaster();
    const pointerVector = new THREE.Vector2();

    /** Was steckt hinter welcher Instanz? Wird beim Aufbau mitgeschrieben. */
    type PickEntry = { index: number; strand: 1 | -1; part: PartKind; label: string; element: string | null };
    const atomPicks: PickEntry[] = [];
    const bondPicks: PickEntry[] = [];
    const hexPicks: PickEntry[] = [];
    const pentPicks: PickEntry[] = [];

    const pickAt = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      pointerVector.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerVector.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerVector, camera);
      const targets: [THREE.InstancedMesh, PickEntry[]][] = [
        [atomMesh, atomPicks],
        [hexMesh, hexPicks],
        [pentMesh, pentPicks],
        [bondMesh, bondPicks],
      ];
      let best: { distance: number; entry: PickEntry } | null = null;
      for (const [mesh, picks] of targets) {
        for (const hit of raycaster.intersectObject(mesh, false)) {
          const id = hit.instanceId;
          if (id === undefined || id >= picks.length) continue;
          if (!best || hit.distance < best.distance) best = { distance: hit.distance, entry: picks[id] };
          break;
        }
      }
      if (!best) return;
      propsRef.current.onSelect(best.entry.index);
      propsRef.current.onPart({
        index: best.entry.index,
        strand: best.entry.strand,
        part: best.entry.part,
        atomLabel: best.entry.label,
        element: best.entry.element,
      });
    };

    const onPointerUp = (event: PointerEvent) => {
      const tap =
        pointers.size === 1 && dragStart && !dragStart.moved && performance.now() - dragStart.time < 500;
      if (tap) pickAt(event.clientX, event.clientY);
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinchStart = null;
      if (pointers.size === 0) dragStart = null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      cameraState.targetDistance = Math.max(
        12,
        Math.min(80, cameraState.targetDistance + event.deltaY * 0.03),
      );
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const resize = () => {
      const width = mount.clientWidth || 1;
      const height = mount.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    /* ---------------- Aufbau der Instanzen ---------------- */
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const color = new THREE.Color();
    const tint = new THREE.Color();
    const vecA = new THREE.Vector3();
    const vecB = new THREE.Vector3();
    const vecC = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const scaleVec = new THREE.Vector3();

    let atomCount = 0;
    let bondCount = 0;
    let hexCount = 0;
    let pentCount = 0;
    let glowCount = 0;

    const emitSphere = (
      position: THREE.Vector3,
      radius: number,
      hex: THREE.Color,
      pick: PickEntry | null,
    ) => {
      if (atomCount >= MAX_SPHERES) return;
      matrix.compose(position, new THREE.Quaternion(), scaleVec.setScalar(radius));
      atomMesh.setMatrixAt(atomCount, matrix);
      atomMesh.setColorAt(atomCount, hex);
      atomPicks[atomCount] = pick ?? atomPicks[atomCount];
      if (pick) atomPicks[atomCount] = pick;
      atomCount++;
    };

    const emitBond = (
      from: THREE.Vector3,
      to: THREE.Vector3,
      radius: number,
      hex: THREE.Color,
      pick: PickEntry | null,
    ) => {
      if (bondCount >= MAX_BONDS) return;
      direction.subVectors(to, from);
      const len = direction.length();
      if (len < 0.0001) return;
      vecC.copy(from).addScaledVector(direction, 0.5);
      quaternion.setFromUnitVectors(up, direction.normalize());
      matrix.compose(vecC, quaternion, scaleVec.set(radius, len, radius));
      bondMesh.setMatrixAt(bondCount, matrix);
      bondMesh.setColorAt(bondCount, hex);
      if (pick) bondPicks[bondCount] = pick;
      bondCount++;
    };

    const emitGlow = (position: THREE.Vector3, radius: number, hex: THREE.Color) => {
      if (glowCount >= MAX_GLOW) return;
      matrix.compose(position, new THREE.Quaternion(), scaleVec.setScalar(radius));
      glowMesh.setMatrixAt(glowCount, matrix);
      glowMesh.setColorAt(glowCount, hex);
      glowCount++;
    };

    /** Zeichnet eine flache Ringscheibe, aufgespannt durch drei Ringatome. */
    const emitRing = (
      points: THREE.Vector3[],
      hex: THREE.Color,
      kind: "sechs" | "fuenf",
      thickness: number,
      pick: PickEntry,
    ) => {
      const target = kind === "sechs" ? hexMesh : pentMesh;
      const picks = kind === "sechs" ? hexPicks : pentPicks;
      const count = kind === "sechs" ? hexCount : pentCount;
      if (count >= MAX_RINGS) return;

      vecA.set(0, 0, 0);
      for (const point of points) vecA.add(point);
      vecA.multiplyScalar(1 / points.length);
      vecB.subVectors(points[0], vecA);
      const radius = vecB.length();
      vecC.subVectors(points[1], vecA);
      direction.crossVectors(vecB, vecC).normalize();

      quaternion.setFromUnitVectors(up, direction);
      // Den Ring so drehen, dass eine Ecke auf dem ersten Atom liegt.
      const localFirst = vecB.clone().applyQuaternion(quaternion.clone().invert());
      const spin = Math.atan2(localFirst.z, localFirst.x);
      quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(up, -spin + Math.PI / 2));

      matrix.compose(vecA, quaternion, scaleVec.set(radius, thickness, radius));
      target.setMatrixAt(count, matrix);
      target.setColorAt(count, hex);
      picks[count] = pick;
      if (kind === "sechs") hexCount++;
      else pentCount++;
    };

    const backboneModel = backbone();

    let unwind = 0;
    let split = 0;
    let flashClock = 0;
    let lastFlashToken = props.flashToken;
    let visibleSpan = props.span;
    let lastSpan = -1;

    const build = () => {
      const current = propsRef.current;
      atomCount = 0;
      bondCount = 0;
      hexCount = 0;
      pentCount = 0;
      glowCount = 0;

      const sequence = current.sequence;
      const replicating = split > 0.02;
      // In der Replikationsansicht geht es um den Ablauf, nicht um die Chemie –
      // dort bleibt es beim übersichtlichen Schema.
      const detail: HelixDetail = replicating ? "schema" : current.detail;
      const splitDistance = 5.4 * split;

      const start = Math.max(
        0,
        Math.min(Math.max(0, sequence.length - visibleSpan), current.center - Math.floor(visibleSpan / 2)),
      );

      const protospacerSet = new Set(current.protospacer);
      const windowSet = new Set(current.editWindow);
      const pamSet = new Set(current.pam);
      const predictedSet = new Set(current.predicted);
      const changedSet = new Set(current.changed);
      const flashSet = new Set(current.flashIndices);

      const anchors: Partial<Record<string, THREE.Vector3>> = {};
      /** An welchem Basenpaar hängt eine Beschriftung? Verteilt sie über die Höhe. */
      const labelRow = (id: string) => {
        const entry = PART_LABELS.find((label) => label.id === id);
        if (!entry || entry.at < 0) return -1;
        return Math.min(visibleSpan - 1, Math.max(0, Math.round(entry.at * (visibleSpan - 1))));
      };
      const windowCenter = new THREE.Vector3();
      let windowCount = 0;
      let labelSlot = 0;

      for (let i = 0; i < visibleSpan; i++) {
        const index = start + i;
        if (index >= sequence.length) break;

        const senseBase = sequence[index] as Base;
        const antiBase = complement(senseBase);
        const { layout, flipped } = basePair(senseBase);

        const angle = i * TWIST_RAD;
        const y = (i - (visibleSpan - 1) / 2) * RISE;

        const inProtospacer = protospacerSet.has(index);
        const separation = replicating ? 0 : inProtospacer ? unwind : 0;
        const twistOpen = separation * 0.3;
        const radialOpen = separation * 0.9;

        // Ankerpunkte der beiden Zucker auf dem Helixkreis.
        const angleSense = angle + twistOpen;
        const angleAnti = angle + STRAND_OFFSET_RAD - twistOpen;
        const radius = RADIUS + radialOpen;

        const senseShiftX = replicating ? -splitDistance : 0;
        const antiShiftX = replicating ? splitDistance : 0;

        const c1Sense = new THREE.Vector3(
          Math.cos(angleSense) * radius + senseShiftX,
          y,
          Math.sin(angleSense) * radius,
        );
        const c1Anti = new THREE.Vector3(
          Math.cos(angleAnti) * radius + antiShiftX,
          y,
          Math.sin(angleAnti) * radius,
        );

        const flashing = flashSet.has(index) ? flashClock : 0;
        const isSelected = index === current.selected;
        const inWindow = windowSet.has(index);
        const predictedHere = predictedSet.has(index);
        const changedHere = changedSet.has(index);
        const guideOnSense = current.guideStrand === 1;

        const highlight = (base: THREE.Color) => {
          if (flashing > 0) return base.clone().lerp(new THREE.Color(0xffffff), Math.min(0.85, flashing));
          if (predictedHere) return base.clone().lerp(new THREE.Color(0xfef08a), 0.4);
          if (isSelected) return base.clone().lerp(new THREE.Color(0xffffff), 0.28);
          // Bereits editierte Stellen bekommen einen Stich ins Magenta,
          // dieselbe Farbe wie der Punkt in der Sequenzleiste.
          if (changedHere) return base.clone().lerp(new THREE.Color(0xe879f9), 0.34);
          if (inWindow) return base.clone().lerp(new THREE.Color(0xfde68a), 0.22);
          return base;
        };

        /* --- Rückgrat: Zucker und Phosphat je Strang --- */
        for (const strand of [0, 1] as const) {
          const anchor = strand === 0 ? c1Sense : c1Anti;
          const strandAngle = strand === 0 ? angleSense : angleAnti;
          const sign = strand === 0 ? 1 : -1;
          const senseIndexStrand: 1 | -1 = strand === 0 ? 1 : -1;

          const radial = new THREE.Vector3(Math.cos(strandAngle), 0, Math.sin(strandAngle));
          const tangent = new THREE.Vector3(-Math.sin(strandAngle), 0, Math.cos(strandAngle));

          const place = (u: number, v: number, w: number, out: THREE.Vector3) =>
            out
              .copy(anchor)
              .addScaledVector(radial, -u * SCALE)
              .addScaledVector(tangent, v * SCALE * sign)
              .setY(anchor.y + w * SCALE * sign);

          let backboneColor = strand === 0 ? SENSE_BACKBONE : ANTISENSE_BACKBONE;
          if (!replicating && pamSet.has(index)) backboneColor = PAM_COLOR;
          else if (!replicating && inProtospacer && (strand === 0) === guideOnSense && current.guideStrand !== null) {
            backboneColor = PROTOSPACER_COLOR;
          }
          if (replicating) {
            // Je Tochterhelix ist genau ein Strang neu – semikonservativ.
            const isNew = strand === 1;
            backboneColor = isNew ? NEW_STRAND : strand === 0 ? SENSE_BACKBONE : ANTISENSE_BACKBONE;
          }
          color.set(backboneColor);
          const shown = highlight(color);

          const positions: THREE.Vector3[] = backboneModel.atoms.map((atom) =>
            place(atom.u, atom.v, atom.w, new THREE.Vector3()),
          );

          const pickFor = (part: PartKind, label: string, element: string | null): PickEntry => ({
            index,
            strand: senseIndexStrand,
            part,
            label,
            element,
          });

          if (detail === "atome") {
            backboneModel.atoms.forEach((atom, atomIndex) => {
              tint.set(ELEMENT_COLORS[atom.element]);
              emitSphere(
                positions[atomIndex],
                ELEMENT_RADIUS_A[atom.element] * SCALE * 0.85,
                flashing > 0 ? highlight(tint) : tint,
                pickFor(atom.part, atom.label, atom.element),
              );
            });
            backboneModel.bonds.forEach((bond) => {
              emitBond(positions[bond.from], positions[bond.to], 0.055, shown, pickFor(bond.part, "Bindung", null));
            });
          } else if (detail === "molekuel") {
            // Zuckerring als Fünfeck, Phosphat als Kugel, dazwischen die Kette.
            const ringAtoms = new Set(backboneModel.sugarRing);
            const ringPoints = backboneModel.sugarRing.map((atomIndex) => positions[atomIndex]);
            emitRing(ringPoints, shown, "fuenf", 0.34, pickFor("zucker", "Desoxyribose", null));
            backboneModel.bonds.forEach((bond) => {
              if (ringAtoms.has(bond.from) && ringAtoms.has(bond.to)) return;
              emitBond(
                positions[bond.from],
                positions[bond.to],
                0.085,
                shown,
                pickFor(bond.part, "Zucker-Phosphat-Rückgrat", null),
              );
            });
            emitSphere(
              positions[backboneModel.phosphorus],
              0.26,
              flashing > 0 ? shown : tint.set(ELEMENT_COLORS.P),
              pickFor("phosphat", "Phosphatgruppe", "P"),
            );
          } else {
            // Schema: eine Kugel je Nukleotid auf dem Rückgrat.
            emitSphere(positions[backboneModel.sugarRing[0]], 0.22, shown, pickFor("zucker", "Zucker", null));
            emitSphere(positions[backboneModel.phosphorus], 0.26, shown, pickFor("phosphat", "Phosphat", "P"));
            emitBond(
              positions[backboneModel.sugarRing[0]],
              positions[backboneModel.phosphorus],
              0.13,
              shown,
              pickFor("zucker", "Rückgrat", null),
            );
          }

          // Verbindung zum nächsten Nukleotid desselben Strangs.
          const nextIndex = start + i + 1;
          if (i + 1 < visibleSpan && nextIndex < sequence.length) {
            const nextAngleBase = (i + 1) * TWIST_RAD;
            const nextSeparation = replicating ? 0 : protospacerSet.has(nextIndex) ? unwind : 0;
            const nextTwist = nextSeparation * 0.3;
            const nextRadius = RADIUS + nextSeparation * 0.9;
            const nextAngle =
              strand === 0 ? nextAngleBase + nextTwist : nextAngleBase + STRAND_OFFSET_RAD - nextTwist;
            const nextY = (i + 1 - (visibleSpan - 1) / 2) * RISE;
            const nextAnchor = new THREE.Vector3(
              Math.cos(nextAngle) * nextRadius + (strand === 0 ? senseShiftX : antiShiftX),
              nextY,
              Math.sin(nextAngle) * nextRadius,
            );
            const nextRadial = new THREE.Vector3(Math.cos(nextAngle), 0, Math.sin(nextAngle));
            const nextTangent = new THREE.Vector3(-Math.sin(nextAngle), 0, Math.cos(nextAngle));
            const linkAtom = strand === 0 ? backboneModel.o3 : backboneModel.phosphorus;
            const otherAtom = strand === 0 ? backboneModel.phosphorus : backboneModel.o3;
            const other = backboneModel.atoms[otherAtom];
            const nextPoint = new THREE.Vector3()
              .copy(nextAnchor)
              .addScaledVector(nextRadial, -other.u * SCALE)
              .addScaledVector(nextTangent, other.v * SCALE * sign)
              .setY(nextAnchor.y + other.w * SCALE * sign);
            emitBond(
              positions[linkAtom],
              nextPoint,
              detail === "schema" ? 0.1 : 0.055,
              shown,
              pickFor("zucker", "Zucker-Phosphat-Rückgrat", null),
            );
          }

          if (!replicating && strand === 0) {
            if (i === labelRow("phosphat")) {
              anchors.phosphat = positions[backboneModel.phosphorus].clone();
            }
            if (i === labelRow("zucker")) {
              anchors.zucker = positions[backboneModel.sugarRing[0]].clone();
            }
            if (i === labelRow("backbone")) {
              anchors.backbone = positions[backboneModel.sugarRing[3]].clone();
            }
          }
        }

        /* --- Basen im Paar-System --- */
        const pairDir = new THREE.Vector3().subVectors(c1Anti, c1Sense).normalize();
        const pairPerp = new THREE.Vector3().crossVectors(up, pairDir).normalize();
        const pairLength = c1Sense.distanceTo(c1Anti);
        const layoutSpan = layout.glycosidic[1].u - layout.glycosidic[0].u;
        const stretch = layoutSpan > 0 ? pairLength / (layoutSpan * SCALE) : 1;

        const placeBase = (u: number, v: number, out: THREE.Vector3, strand: 0 | 1) => {
          // Bei gespiegeltem Paar sitzt das Purin auf dem Gegenstrang.
          const uu = flipped ? layoutSpan - u : u;
          const vv = flipped ? -v : v;
          void strand;
          return out
            .copy(c1Sense)
            .addScaledVector(pairDir, uu * SCALE * stretch)
            .addScaledVector(pairPerp, vv * SCALE);
        };

        const basePositions = layout.atoms.map((atom, atomIndex) => {
          void atomIndex;
          return placeBase(atom.u, atom.v, new THREE.Vector3(), atom.strand);
        });

        /** Welcher Strang trägt dieses Atom nach der Spiegelung? */
        const strandOf = (raw: 0 | 1): 1 | -1 => {
          const effective = flipped ? (raw === 0 ? 1 : 0) : raw;
          return effective === 0 ? 1 : -1;
        };
        const baseOf = (raw: 0 | 1): Base => (strandOf(raw) === 1 ? senseBase : antiBase);

        if (detail === "atome") {
          layout.atoms.forEach((atom, atomIndex) => {
            tint.set(ELEMENT_COLORS[atom.element]);
            emitSphere(
              basePositions[atomIndex],
              ELEMENT_RADIUS_A[atom.element] * SCALE * 0.85,
              flashing > 0 ? highlight(tint) : tint,
              {
                index,
                strand: strandOf(atom.strand),
                part: "base",
                label: atom.label,
                element: atom.element,
              },
            );
          });
          layout.bonds.forEach((bond) => {
            color.set(BASE_COLORS[baseOf(bond.strand)]);
            emitBond(basePositions[bond.from], basePositions[bond.to], 0.055, highlight(color), {
              index,
              strand: strandOf(bond.strand),
              part: "base",
              label: "Bindung",
              element: null,
            });
          });
        } else if (detail === "molekuel") {
          for (const ring of layout.rings) {
            color.set(BASE_COLORS[baseOf(ring.strand)]);
            emitRing(
              ring.indices.map((atomIndex) => basePositions[atomIndex]),
              highlight(color),
              ring.kind,
              0.84,
              {
                index,
                strand: strandOf(ring.strand),
                part: "base",
                label: `Base ${baseOf(ring.strand)}`,
                element: null,
              },
            );
          }
          // Glykosidische Bindung und die Gruppen außerhalb der Ringe.
          const ringAtoms = new Set(layout.rings.flatMap((ring) => ring.indices));
          layout.bonds.forEach((bond) => {
            if (ringAtoms.has(bond.from) && ringAtoms.has(bond.to)) return;
            color.set(BASE_COLORS[baseOf(bond.strand)]);
            emitBond(basePositions[bond.from], basePositions[bond.to], 0.06, highlight(color), null);
          });
          for (const strand of [0, 1] as const) {
            const anchor = strand === 0 ? c1Sense : c1Anti;
            const attach = layout.atoms.findIndex((atom) => atom.strand === strand);
            if (attach >= 0) {
              color.set(BASE_COLORS[baseOf(strand)]);
              emitBond(anchor, basePositions[attach], 0.06, highlight(color), null);
            }
          }
        } else {
          // Schema: zwei Halbstäbe, die sich in der Mitte treffen.
          const middle = new THREE.Vector3().addVectors(c1Sense, c1Anti).multiplyScalar(0.5);
          const senseEnd = new THREE.Vector3().lerpVectors(c1Sense, middle, 0.84);
          const antiEnd = new THREE.Vector3().lerpVectors(c1Anti, middle, 0.84);
          color.set(BASE_COLORS[senseBase]);
          emitBond(c1Sense, senseEnd, isPurine(senseBase) ? 0.16 : 0.12, highlight(color), {
            index,
            strand: 1,
            part: "base",
            label: `Base ${senseBase}`,
            element: null,
          });
          color.set(BASE_COLORS[antiBase]);
          emitBond(c1Anti, antiEnd, isPurine(antiBase) ? 0.16 : 0.12, highlight(color), {
            index,
            strand: -1,
            part: "base",
            label: `Base ${antiBase}`,
            element: null,
          });
          color.set(HBOND_COLOR);
          emitBond(senseEnd, antiEnd, 0.05, color, null);
        }

        /* --- Wasserstoffbrücken --- */
        if (detail !== "schema" && separation < 0.5) {
          color.set(HBOND_COLOR);
          for (const [a, b] of layout.hydrogenBonds) {
            const from = basePositions[a];
            const to = basePositions[b];
            // Gestrichelt: drei kurze Stücke statt eines durchgehenden Stabs.
            for (let piece = 0; piece < 3; piece++) {
              const t0 = piece / 3 + 0.06;
              const t1 = (piece + 1) / 3 - 0.06;
              vecA.lerpVectors(from, to, t0);
              vecB.lerpVectors(from, to, t1);
              emitBond(vecA, vecB, 0.032, color, null);
            }
          }
          if (!replicating && i === labelRow("hbond") && layout.hydrogenBonds.length > 0) {
            const [a, b] = layout.hydrogenBonds[Math.floor(layout.hydrogenBonds.length / 2)];
            anchors.hbond = new THREE.Vector3()
              .addVectors(basePositions[a], basePositions[b])
              .multiplyScalar(0.5);
          }
        }

        if (!replicating && i === labelRow("base")) {
          anchors.base = basePositions[Math.floor(basePositions.length / 4)].clone();
        }

        /* --- Leuchten für vorhergesagte Änderungen --- */
        if (predictedHere || flashing > 0) {
          color.set(predictedHere ? current.editorColor : "#ffffff");
          const middle = new THREE.Vector3().addVectors(c1Sense, c1Anti).multiplyScalar(0.5);
          emitGlow(middle, 0.9 + flashing * 1.4, color);
        }

        if (inWindow) {
          windowCenter.add(new THREE.Vector3().addVectors(c1Sense, c1Anti).multiplyScalar(0.5));
          windowCount++;
        }

        /* --- Buchstaben --- */
        if (current.showLabels && !replicating) {
          const middle = new THREE.Vector3().addVectors(c1Sense, c1Anti).multiplyScalar(0.5);
          const axisPoint = new THREE.Vector3(0, y, 0);
          for (const [base, anchor] of [
            [senseBase, c1Sense],
            [antiBase, c1Anti],
          ] as const) {
            const sprite = letterSprites[labelSlot++];
            if (!sprite) continue;
            sprite.visible = true;
            sprite.position.copy(anchor).lerp(middle, 0.34);
            const material = sprite.material as THREE.SpriteMaterial;
            material.map = letterTexture(base);
            const behind = camera.position.distanceTo(sprite.position) > camera.position.distanceTo(axisPoint);
            material.opacity = behind ? 0.3 : 1;
            material.needsUpdate = true;
          }
        }

        /* --- Auswahlring --- */
        if (isSelected && !replicating) {
          const middle = new THREE.Vector3().addVectors(c1Sense, c1Anti).multiplyScalar(0.5);
          selectionRing.visible = true;
          selectionRing.position.copy(middle);
          selectionRing.lookAt(camera.position);
          selectionRing.scale.setScalar(2.1);
          selectionMaterial.color.set(current.editorColor);
          selectionMaterial.opacity = 0.6 + Math.sin(performance.now() * 0.005) * 0.25;
        }
      }

      for (let i = labelSlot; i < letterSprites.length; i++) letterSprites[i].visible = false;

      /* --- Beschriftungen der Bauteile --- */
      const showParts = propsRef.current.showParts && !replicating;
      PART_LABELS.forEach((entry, spriteIndex) => {
        const sprite = partSprites[spriteIndex];
        if (!showParts) {
          sprite.visible = false;
          return;
        }

        if (entry.id === "major" || entry.id === "minor") {
          // Die Furchen liegen zwischen den Strängen: die kleine auf der
          // kurzen Seite des Winkels, die große auf der langen.
          const middleAngle =
            entry.id === "minor" ? STRAND_OFFSET_RAD / 2 : STRAND_OFFSET_RAD / 2 + Math.PI;
          // Weit oben und weit unten, damit sie den Bauteil-Schildern in der
          // Mitte nicht ins Gehege kommen.
          const height = (entry.id === "minor" ? 1 : -1) * RISE * visibleSpan * 0.34;
          sprite.visible = true;
          sprite.position.set(
            Math.cos(middleAngle) * (RADIUS + 4.8),
            height,
            Math.sin(middleAngle) * (RADIUS + 4.8),
          );
          color.set(entry.color);
          vecA.set(Math.cos(middleAngle) * (RADIUS + 0.4), height, Math.sin(middleAngle) * (RADIUS + 0.4));
          emitBond(vecA, sprite.position, 0.022, color, null);
          return;
        }

        const anchor = anchors[entry.id];
        if (!anchor) {
          sprite.visible = false;
          return;
        }
        sprite.visible = true;
        const outward = anchor.clone().setY(0);
        if (outward.lengthSq() < 0.001) outward.set(1, 0, 0);
        outward.normalize();
        // Das Schild sitzt außerhalb der Helix, eine dünne Linie führt hin.
        sprite.position
          .copy(anchor)
          .addScaledVector(outward, 3.4)
          .setY(anchor.y + 0.25);
        color.set(entry.color);
        emitBond(anchor, sprite.position, 0.022, color, null);
      });

      atomMesh.count = atomCount;
      bondMesh.count = bondCount;
      hexMesh.count = hexCount;
      pentMesh.count = pentCount;
      glowMesh.count = glowCount;
      atomMesh.instanceMatrix.needsUpdate = true;
      bondMesh.instanceMatrix.needsUpdate = true;
      hexMesh.instanceMatrix.needsUpdate = true;
      pentMesh.instanceMatrix.needsUpdate = true;
      glowMesh.instanceMatrix.needsUpdate = true;
      if (atomMesh.instanceColor) atomMesh.instanceColor.needsUpdate = true;
      if (bondMesh.instanceColor) bondMesh.instanceColor.needsUpdate = true;
      if (hexMesh.instanceColor) hexMesh.instanceColor.needsUpdate = true;
      if (pentMesh.instanceColor) pentMesh.instanceColor.needsUpdate = true;
      if (glowMesh.instanceColor) glowMesh.instanceColor.needsUpdate = true;

      return { windowCenter, windowCount };
    };

    /* ---------------- Renderschleife ---------------- */
    let running = true;
    let frame = 0;
    const clock = new THREE.Clock();

    const render = () => {
      if (!running) return;
      frame = requestAnimationFrame(render);
      const delta = Math.min(clock.getDelta(), 0.05);
      const current = propsRef.current;

      visibleSpan = Math.max(7, Math.min(maxSpan, current.span));
      if (visibleSpan !== lastSpan) {
        lastSpan = visibleSpan;
        cameraState.targetDistance = Math.max(12, Math.min(80, 17 + visibleSpan * 1.05));
      }

      unwind += ((current.enzymeBound ? 1 : 0) - unwind) * Math.min(1, delta * 5);
      split += ((current.mode === "replication" ? 1 : 0) - split) * Math.min(1, delta * 2.2);
      if (current.flashToken !== lastFlashToken) {
        lastFlashToken = current.flashToken;
        flashClock = 1;
      }
      flashClock = Math.max(0, flashClock - delta * 0.9);

      cameraState.distance += (cameraState.targetDistance - cameraState.distance) * Math.min(1, delta * 8);
      if (pointers.size === 0) cameraState.theta += delta * 0.055;
      applyCamera();

      selectionRing.visible = false;
      const result = build();

      enzyme.visible = current.enzymeBound && result.windowCount > 0 && unwind > 0.02 && split < 0.1;
      if (enzyme.visible) {
        const anchor = result.windowCenter.multiplyScalar(1 / result.windowCount);
        const radial = new THREE.Vector3(anchor.x, 0, anchor.z);
        if (radial.lengthSq() < 0.0001) radial.set(1, 0, 0);
        radial.normalize();
        enzyme.position.copy(anchor).addScaledVector(radial, 2.6 * unwind);
        enzyme.lookAt(enzyme.position.clone().add(radial));
        enzyme.scale.setScalar(0.5 + unwind * 0.5);
        deaminaseMaterial.color.set(current.editorColor);
        deaminaseMaterial.emissive.set(current.editorColor);
        deaminaseMaterial.emissiveIntensity = 0.6 + Math.sin(performance.now() * 0.004) * 0.3;
      }

      renderer.render(scene, camera);
    };

    frame = requestAnimationFrame(render);

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else if (!running) {
        running = true;
        clock.getDelta();
        frame = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      running = false;
      cancelAnimationFrame(frame);
    };
    const onContextRestored = () => {
      if (!running) {
        running = true;
        clock.getDelta();
        frame = requestAnimationFrame(render);
      }
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      letterTextures.forEach((texture) => texture.dispose());
      disposables.forEach((item) => item.dispose());
      renderer.dispose();
      if (canvas.parentNode === mount) mount.removeChild(canvas);
    };
    // Die Szene wird einmal aufgebaut; Aktualisierungen laufen über propsRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mountRef} className="h-full w-full" aria-hidden="true" />;
}
