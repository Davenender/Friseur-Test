"use client";

/**
 * Die 3D-Darstellung der Doppelhelix.
 *
 * Bewusst mit reinem three.js gebaut: Alle Meshes werden einmal angelegt und
 * danach nur noch bewegt und umgefärbt. Dadurch entstehen beim Blättern durch
 * die Sequenz keine Geometrie-Neuberechnungen – wichtig für flüssige 60 fps
 * auf einem iPad.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Base } from "@/lib/bio/genetics";
import { complement, isPurine } from "@/lib/bio/genetics";
import { BASE_COLORS } from "@/lib/bio/colors";

const SENSE_BACKBONE = "#cbd5e1";
const ANTISENSE_BACKBONE = "#7f8ea3";
const NEW_STRAND = "#22d3ee";

/** Anstieg pro Basenpaar (Å-Verhältnis von B-DNA, in Szeneneinheiten). */
const RISE = 1.05;
/** Verdrillung pro Basenpaar: 10,5 bp pro Umdrehung. */
const TWIST = (2 * Math.PI) / 10.5;
/** Radius der Zucker-Phosphat-Rückgrate. */
const RADIUS = 3.15;
/** Winkelversatz der beiden Stränge – erzeugt große und kleine Furche. */
const STRAND_OFFSET = 2.55;

export type HelixMode = "helix" | "replication";

export interface HelixProps {
  sequence: string;
  /** Index, der in der Mitte der Ansicht steht. */
  center: number;
  /** Wie viele Basenpaare gleichzeitig dargestellt werden. */
  span: number;
  selected: number | null;
  /** Sinnstrang-Indizes des Protospacers. */
  protospacer: number[];
  /** Sinnstrang-Indizes des Editierfensters. */
  editWindow: number[];
  /** Sinnstrang-Indizes des PAM. */
  pam: number[];
  /** Vorhergesagte Änderungen. */
  predicted: number[];
  /** Basen, die von der Referenz abweichen. */
  changed: number[];
  /** Auf welchem Strang die Guide-RNA sitzt (1 = Sinnstrang). */
  guideStrand: 1 | -1 | null;
  editorColor: string;
  /** Steht das Enzym gerade am Ziel? */
  enzymeBound: boolean;
  mode: HelixMode;
  showLabels: boolean;
  /** Erhöht sich bei jedem Edit und löst die Blitz-Animation aus. */
  flashToken: number;
  flashIndices: number[];
  onSelect: (index: number) => void;
  onCenterChange: (center: number) => void;
}

function orientCylinder(mesh: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3, thickness: number) {
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = direction.length();
  mesh.position.copy(from).addScaledVector(direction, 0.5);
  mesh.scale.set(thickness, Math.max(length, 0.001), thickness);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
}

function makeLetterTexture(letter: string, color: string): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "rgba(3, 7, 18, 0.82)";
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
    ctx.fillText(letter, size / 2, size / 2 + 4);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

interface PairMeshes {
  nodeTop: THREE.Mesh;
  nodeBottom: THREE.Mesh;
  linkTop: THREE.Mesh;
  linkBottom: THREE.Mesh;
  halfTop: THREE.Mesh;
  halfBottom: THREE.Mesh;
  bond: THREE.Mesh;
  labelTop: THREE.Sprite;
  labelBottom: THREE.Sprite;
  ring: THREE.Mesh;
}

export function HelixCanvas(props: HelixProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef(props);

  // Die Renderschleife liest den Zustand aus dieser Referenz, statt bei jeder
  // Änderung neu aufgebaut zu werden.
  useEffect(() => {
    propsRef.current = props;
  });

  /** Alles, was zwischen den Renderframes erhalten bleiben muss. */
  const apiRef = useRef<{ dispose: () => void } | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    /* ---------------- Renderer, Szene, Kamera ---------------- */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth || 640, mount.clientHeight || 480, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(6, 10, 12);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7dd3fc, 0.9);
    rim.position.set(-10, -4, -8);
    scene.add(rim);
    const fill = new THREE.PointLight(0xa855f7, 0.7, 90);
    fill.position.set(0, 0, 16);
    scene.add(fill);

    /* ---------------- Geometrien und Materialien ------------- */
    const sphereGeometry = new THREE.SphereGeometry(0.42, 16, 12);
    const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true);
    const bondGeometry = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
    const ringGeometry = new THREE.TorusGeometry(1.5, 0.11, 8, 28);

    const letterTextures = new Map<string, THREE.Texture>();
    const letterTexture = (letter: Base) => {
      const cached = letterTextures.get(letter);
      if (cached) return cached;
      const texture = makeLetterTexture(letter, BASE_COLORS[letter]);
      letterTextures.set(letter, texture);
      return texture;
    };
    // Texturen vorab erzeugen, damit beim ersten Frame nichts fehlt.
    (["A", "C", "G", "T"] as Base[]).forEach(letterTexture);

    const disposables: { dispose: () => void }[] = [
      sphereGeometry,
      cylinderGeometry,
      bondGeometry,
      ringGeometry,
    ];

    const helixGroup = new THREE.Group();
    scene.add(helixGroup);

    const maxSpan = 41;
    const pairs: PairMeshes[] = [];
    /** Zweiter Satz Meshes – nur in der Replikationsansicht für die zweite Tochterhelix. */
    const daughters: PairMeshes[] = [];
    const pickTargets: THREE.Mesh[] = [];

    const createPair = (i: number, pickable: boolean): PairMeshes => {
      const backboneMaterialTop = new THREE.MeshStandardMaterial({
        color: SENSE_BACKBONE,
        roughness: 0.45,
        metalness: 0.25,
      });
      const backboneMaterialBottom = new THREE.MeshStandardMaterial({
        color: ANTISENSE_BACKBONE,
        roughness: 0.45,
        metalness: 0.25,
      });
      const baseMaterialTop = new THREE.MeshStandardMaterial({ roughness: 0.32, metalness: 0.1 });
      const baseMaterialBottom = new THREE.MeshStandardMaterial({ roughness: 0.32, metalness: 0.1 });
      const bondMaterial = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        transparent: true,
        opacity: 0.4,
        roughness: 0.6,
      });
      const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });

      const nodeTop = new THREE.Mesh(sphereGeometry, backboneMaterialTop);
      const nodeBottom = new THREE.Mesh(sphereGeometry, backboneMaterialBottom);
      const linkTop = new THREE.Mesh(cylinderGeometry, backboneMaterialTop);
      const linkBottom = new THREE.Mesh(cylinderGeometry, backboneMaterialBottom);
      const halfTop = new THREE.Mesh(cylinderGeometry, baseMaterialTop);
      const halfBottom = new THREE.Mesh(cylinderGeometry, baseMaterialBottom);
      const bond = new THREE.Mesh(bondGeometry, bondMaterial);
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);

      const labelTop = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: letterTexture("A"),
          transparent: true,
          depthTest: false,
          depthWrite: false,
        }),
      );
      const labelBottom = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: letterTexture("T"),
          transparent: true,
          depthTest: false,
          depthWrite: false,
        }),
      );
      labelTop.scale.setScalar(1.35);
      labelBottom.scale.setScalar(1.35);
      labelTop.renderOrder = 5;
      labelBottom.renderOrder = 5;

      if (pickable) {
        halfTop.userData.pairIndex = i;
        halfBottom.userData.pairIndex = i;
        pickTargets.push(halfTop, halfBottom);
      }

      const group = new THREE.Group();
      group.add(nodeTop, nodeBottom, linkTop, linkBottom, halfTop, halfBottom, bond, ring, labelTop, labelBottom);
      helixGroup.add(group);

      disposables.push(
        backboneMaterialTop,
        backboneMaterialBottom,
        baseMaterialTop,
        baseMaterialBottom,
        bondMaterial,
        ringMaterial,
        labelTop.material,
        labelBottom.material,
      );

      return { nodeTop, nodeBottom, linkTop, linkBottom, halfTop, halfBottom, bond, labelTop, labelBottom, ring };
    };

    for (let i = 0; i < maxSpan; i++) {
      pairs.push(createPair(i, true));
      daughters.push(createPair(i, false));
    }

    /* ---------------- Enzymkomplex --------------------------- */
    const enzyme = new THREE.Group();
    enzyme.visible = false;
    scene.add(enzyme);

    const casMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b9dff,
      transparent: true,
      opacity: 0.34,
      roughness: 0.25,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const lobeGeometry = new THREE.SphereGeometry(2.9, 28, 20);
    const lobeA = new THREE.Mesh(lobeGeometry, casMaterial);
    lobeA.scale.set(1.05, 1.35, 0.85);
    lobeA.position.set(2.1, 1.0, 0);
    const lobeB = new THREE.Mesh(lobeGeometry, casMaterial);
    lobeB.scale.set(0.85, 1.0, 0.7);
    lobeB.position.set(3.2, -2.4, 0.4);

    const deaminaseMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.8,
      roughness: 0.25,
    });
    const deaminaseGeometry = new THREE.SphereGeometry(1.25, 24, 18);
    const deaminase = new THREE.Mesh(deaminaseGeometry, deaminaseMaterial);
    deaminase.position.set(1.3, 3.6, 0.6);

    const rnaMaterial = new THREE.MeshStandardMaterial({
      color: 0xfb923c,
      emissive: 0xea580c,
      emissiveIntensity: 0.35,
      roughness: 0.4,
    });
    const rnaGeometry = new THREE.TorusGeometry(1.7, 0.22, 10, 24);
    const rnaLoop = new THREE.Mesh(rnaGeometry, rnaMaterial);
    rnaLoop.position.set(3.4, 2.6, -0.4);
    rnaLoop.rotation.set(0.5, 0.4, 0);

    enzyme.add(lobeA, lobeB, deaminase, rnaLoop);
    disposables.push(casMaterial, lobeGeometry, deaminaseMaterial, deaminaseGeometry, rnaMaterial, rnaGeometry);

    /** Die Guide-RNA als Kette kleiner Kugeln entlang des Protospacers. */
    const rnaStrand = new THREE.Group();
    scene.add(rnaStrand);
    const rnaBeadGeometry = new THREE.SphereGeometry(0.3, 10, 8);
    const rnaBeadMaterial = new THREE.MeshStandardMaterial({
      color: 0xfb923c,
      emissive: 0xf97316,
      emissiveIntensity: 0.45,
      roughness: 0.4,
    });
    const rnaBeads: THREE.Mesh[] = [];
    for (let i = 0; i < maxSpan; i++) {
      const bead = new THREE.Mesh(rnaBeadGeometry, rnaBeadMaterial);
      bead.visible = false;
      rnaStrand.add(bead);
      rnaBeads.push(bead);
    }
    disposables.push(rnaBeadGeometry, rnaBeadMaterial);

    /* ---------------- Kamerasteuerung ------------------------ */
    const cameraState = { theta: 0, phi: 0.16, distance: 38, targetDistance: 38 };
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
      if (list.length < 2) return 0;
      return Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y);
    };
    const pointerMidY = () => {
      const list = [...pointers.values()];
      if (list.length < 2) return 0;
      return (list[0].y + list[1].y) / 2;
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
          const scale = pinchStart.distance / distance;
          cameraState.targetDistance = Math.max(14, Math.min(70, pinchStart.camera * scale));
        }
        // Zwei Finger nach oben/unten = an der Sequenz entlangfahren.
        const deltaY = pointerMidY() - pinchStart.midY;
        const steps = Math.round(deltaY / 22);
        const next = pinchStart.center + steps;
        if (next !== propsRef.current.center) propsRef.current.onCenterChange(next);
      }
    };

    const raycaster = new THREE.Raycaster();
    const pointerVector = new THREE.Vector2();

    const pickAt = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      pointerVector.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerVector.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerVector, camera);
      const hits = raycaster.intersectObjects(pickTargets, false);
      for (const hit of hits) {
        if (!hit.object.visible) continue;
        const pairIndex = hit.object.userData.pairIndex as number | undefined;
        if (pairIndex === undefined) continue;
        const { center, span, sequence } = propsRef.current;
        const start = Math.max(0, Math.min(sequence.length - span, center - Math.floor(span / 2)));
        const index = start + pairIndex;
        if (index >= 0 && index < sequence.length) propsRef.current.onSelect(index);
        return;
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      const wasSingleTap =
        pointers.size === 1 && dragStart && !dragStart.moved && performance.now() - dragStart.time < 500;
      if (wasSingleTap) pickAt(event.clientX, event.clientY);
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinchStart = null;
      if (pointers.size === 0) dragStart = null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      cameraState.targetDistance = Math.max(14, Math.min(70, cameraState.targetDistance + event.deltaY * 0.03));
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    /* ---------------- Größenanpassung ------------------------ */
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

    /* ---------------- Animationszustand ---------------------- */
    let unwind = 0;
    let split = 0;
    let flashClock = 0;
    let lastFlashToken = props.flashToken;
    const phase = 0;
    let running = true;
    let frame = 0;

    const pTop = new THREE.Vector3();
    const pBottom = new THREE.Vector3();
    const middle = new THREE.Vector3();
    const topEnd = new THREE.Vector3();
    const bottomEnd = new THREE.Vector3();
    const nextTop = new THREE.Vector3();
    const nextBottom = new THREE.Vector3();
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const m = new THREE.Vector3();
    const tEnd = new THREE.Vector3();
    const bEnd = new THREE.Vector3();
    const scratch = new THREE.Vector3();
    const color = new THREE.Color();

    const backbonePoint = (i: number, strand: 0 | 1, out: THREE.Vector3, radius: number, angleShift: number) => {
      const angle = phase + i * TWIST + (strand === 1 ? STRAND_OFFSET : 0) + angleShift;
      out.set(Math.cos(angle) * radius, (i - (visibleSpan - 1) / 2) * RISE, Math.sin(angle) * radius);
      return out;
    };

    let visibleSpan = props.span;
    let lastSpan = -1;

    const clock = new THREE.Clock();

    const render = () => {
      if (!running) return;
      frame = requestAnimationFrame(render);
      const delta = Math.min(clock.getDelta(), 0.05);

      const current = propsRef.current;
      visibleSpan = Math.max(7, Math.min(maxSpan, current.span));
      if (visibleSpan !== lastSpan) {
        lastSpan = visibleSpan;
        cameraState.targetDistance = Math.max(14, Math.min(70, 17 + visibleSpan * 1.02));
      }

      const targetUnwind = current.enzymeBound ? 1 : 0;
      unwind += (targetUnwind - unwind) * Math.min(1, delta * 5);

      const targetSplit = current.mode === "replication" ? 1 : 0;
      split += (targetSplit - split) * Math.min(1, delta * 2.2);

      if (current.flashToken !== lastFlashToken) {
        lastFlashToken = current.flashToken;
        flashClock = 1;
      }
      flashClock = Math.max(0, flashClock - delta * 0.9);

      cameraState.distance += (cameraState.targetDistance - cameraState.distance) * Math.min(1, delta * 8);
      applyCamera();

      const sequence = current.sequence;
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

      let enzymeAnchor: THREE.Vector3 | null = null;
      let enzymeCount = 0;
      const anchorSum = new THREE.Vector3();

      const replicating = split > 0.02;
      const splitDistance = 5.4 * split;

      const hidePair = (meshes: PairMeshes) => {
        meshes.nodeTop.visible = false;
        meshes.nodeBottom.visible = false;
        meshes.linkTop.visible = false;
        meshes.linkBottom.visible = false;
        meshes.halfTop.visible = false;
        meshes.halfBottom.visible = false;
        meshes.bond.visible = false;
        meshes.ring.visible = false;
        meshes.labelTop.visible = false;
        meshes.labelBottom.visible = false;
      };

      for (let i = 0; i < maxSpan; i++) {
        const pair = pairs[i];
        const daughter = daughters[i];
        const index = start + i;
        const inView = i < visibleSpan && index < sequence.length;

        if (!inView) {
          hidePair(pair);
          hidePair(daughter);
          continue;
        }

        const senseBase = sequence[index] as Base;
        const antiBase = complement(senseBase);
        const hasNext = i < visibleSpan - 1 && index + 1 < sequence.length;

        const inProtospacer = protospacerSet.has(index);
        const inWindow = windowSet.has(index);
        const separation = replicating ? 0 : inProtospacer ? unwind : 0;

        // Beim Binden des Enzyms öffnet sich die Helix lokal: die R-Schleife.
        const topShift = separation * 0.32;
        const bottomShift = -separation * 0.32;
        const radiusBoost = separation * 0.85;

        backbonePoint(i, 0, pTop, RADIUS + radiusBoost, topShift);
        backbonePoint(i, 1, pBottom, RADIUS + radiusBoost, bottomShift);
        middle.copy(pTop).lerp(pBottom, 0.5);
        topEnd.copy(pTop).lerp(middle, 0.82);
        bottomEnd.copy(pBottom).lerp(middle, 0.82);
        backbonePoint(i + 1, 0, nextTop, RADIUS + radiusBoost, topShift);
        backbonePoint(i + 1, 1, nextBottom, RADIUS + radiusBoost, bottomShift);

        const flashing = flashSet.has(index) ? flashClock : 0;
        const changedHere = changedSet.has(index);
        const predictedHere = predictedSet.has(index);
        const isSelected = index === current.selected;

        let emissive = 0;
        if (isSelected) emissive = 0.55;
        if (inWindow) emissive = Math.max(emissive, 0.4);
        if (predictedHere) emissive = Math.max(emissive, 0.6);
        if (changedHere) emissive = Math.max(emissive, 0.35);
        emissive += flashing * 2.2;

        /**
         * Zeichnet ein Basenpaar. `newStrand` markiert den Strang, der bei der
         * Replikation gerade neu entsteht – er wächst mit `split` heran.
         */
        const drawPair = (
          meshes: PairMeshes,
          offsetX: number,
          newStrand: "none" | "top" | "bottom",
          allowRing: boolean,
        ) => {
          const growTop = newStrand === "top" ? split : 1;
          const growBottom = newStrand === "bottom" ? split : 1;

          meshes.nodeTop.visible = true;
          meshes.nodeBottom.visible = true;
          meshes.linkTop.visible = hasNext;
          meshes.linkBottom.visible = hasNext;
          meshes.halfTop.visible = growTop > 0.05;
          meshes.halfBottom.visible = growBottom > 0.05;
          meshes.bond.visible = growTop > 0.05 && growBottom > 0.05;
          meshes.ring.visible = allowRing && isSelected && !replicating;
          meshes.labelTop.visible = current.showLabels && growTop > 0.35;
          meshes.labelBottom.visible = current.showLabels && growBottom > 0.35;

          a.copy(pTop).setX(pTop.x + offsetX);
          b.copy(pBottom).setX(pBottom.x + offsetX);
          m.copy(middle).setX(middle.x + offsetX);
          tEnd.copy(topEnd).setX(topEnd.x + offsetX);
          bEnd.copy(bottomEnd).setX(bottomEnd.x + offsetX);

          meshes.nodeTop.position.copy(a);
          meshes.nodeTop.scale.setScalar(growTop);
          meshes.nodeBottom.position.copy(b);
          meshes.nodeBottom.scale.setScalar(growBottom);

          if (hasNext) {
            scratch.copy(nextTop).setX(nextTop.x + offsetX);
            orientCylinder(meshes.linkTop, a, scratch, 0.26 * growTop);
            scratch.copy(nextBottom).setX(nextBottom.x + offsetX);
            orientCylinder(meshes.linkBottom, b, scratch, 0.26 * growBottom);
          }

          // Basenstäbe haben feste Länge: Sie dehnen sich beim Auftrennen nicht.
          if (meshes.halfTop.visible) {
            scratch.copy(a).lerp(tEnd, growTop);
            orientCylinder(meshes.halfTop, a, scratch, isPurine(senseBase) ? 0.42 : 0.32);
          }
          if (meshes.halfBottom.visible) {
            scratch.copy(b).lerp(bEnd, growBottom);
            orientCylinder(meshes.halfBottom, b, scratch, isPurine(antiBase) ? 0.42 : 0.32);
          }
          if (meshes.bond.visible) {
            orientCylinder(meshes.bond, tEnd, bEnd, 0.14);
            (meshes.bond.material as THREE.MeshStandardMaterial).opacity =
              0.42 * (1 - separation) * Math.min(growTop, growBottom);
          }

          const topMaterial = meshes.halfTop.material as THREE.MeshStandardMaterial;
          const bottomMaterial = meshes.halfBottom.material as THREE.MeshStandardMaterial;
          topMaterial.color.set(BASE_COLORS[senseBase]);
          bottomMaterial.color.set(BASE_COLORS[antiBase]);
          topMaterial.emissive.set(BASE_COLORS[senseBase]);
          bottomMaterial.emissive.set(BASE_COLORS[antiBase]);
          topMaterial.emissiveIntensity = emissive;
          bottomMaterial.emissiveIntensity = emissive;

          const pulse = 1 + flashing * 0.6;
          meshes.halfTop.scale.x *= pulse;
          meshes.halfTop.scale.z *= pulse;
          meshes.halfBottom.scale.x *= pulse;
          meshes.halfBottom.scale.z *= pulse;

          // Rückgrat einfärben.
          const topBackbone = meshes.nodeTop.material as THREE.MeshStandardMaterial;
          const bottomBackbone = meshes.nodeBottom.material as THREE.MeshStandardMaterial;
          const guideOnSense = current.guideStrand === 1;

          if (newStrand === "top") color.set(NEW_STRAND);
          else if (replicating) color.set(SENSE_BACKBONE);
          else if (pamSet.has(index)) color.set(0xf472b6);
          else if (inProtospacer && guideOnSense) color.set(0xfb923c);
          else color.set(SENSE_BACKBONE);
          topBackbone.color.copy(color);

          if (newStrand === "bottom") color.set(NEW_STRAND);
          else if (replicating) color.set(ANTISENSE_BACKBONE);
          else if (pamSet.has(index)) color.set(0xf472b6);
          else if (inProtospacer && !guideOnSense && current.guideStrand !== null) color.set(0xfb923c);
          else color.set(ANTISENSE_BACKBONE);
          bottomBackbone.color.copy(color);

          // Beschriftungen: immer lesbar, aber die Rückseite wird abgedunkelt.
          if (current.showLabels) {
            const axisDistance = camera.position.distanceTo(scratch.set(m.x, m.y, 0));
            for (const [sprite, position, base, grow] of [
              [meshes.labelTop, a, senseBase, growTop],
              [meshes.labelBottom, b, antiBase, growBottom],
            ] as const) {
              if (!sprite.visible) continue;
              scratch.copy(position).lerp(m, 0.4);
              sprite.position.copy(scratch);
              const material = sprite.material as THREE.SpriteMaterial;
              material.map = letterTexture(base);
              const behind = camera.position.distanceTo(scratch) > axisDistance;
              material.opacity = (behind ? 0.3 : 1) * grow;
              material.needsUpdate = true;
            }
          }

          if (meshes.ring.visible) {
            const ringMaterial = meshes.ring.material as THREE.MeshBasicMaterial;
            ringMaterial.opacity = 0.65 + Math.sin(performance.now() * 0.005) * 0.25;
            ringMaterial.color.set(current.editorColor);
            meshes.ring.position.copy(m);
            meshes.ring.lookAt(camera.position);
            meshes.ring.scale.setScalar(1.9);
          }
        };

        if (replicating) {
          // Zwei Tochterhelices: je ein alter und ein neuer Strang – semikonservativ.
          drawPair(pair, -splitDistance, "bottom", false);
          drawPair(daughter, splitDistance, "top", false);
        } else {
          drawPair(pair, 0, "none", true);
          hidePair(daughter);
        }

        if (inWindow && !replicating) {
          anchorSum.add(middle);
          enzymeCount++;
        }

        const bead = rnaBeads[i];
        bead.visible = current.enzymeBound && inProtospacer && !replicating;
        if (bead.visible) {
          const onSense = current.guideStrand === 1;
          bead.position.copy(onSense ? pTop : pBottom).lerp(middle, 0.28);
          bead.position.multiplyScalar(1.06);
        }
      }

      if (enzymeCount > 0) {
        enzymeAnchor = anchorSum.multiplyScalar(1 / enzymeCount);
      }

      enzyme.visible = current.enzymeBound && enzymeAnchor !== null && unwind > 0.02;
      if (enzyme.visible && enzymeAnchor) {
        const radial = new THREE.Vector3(enzymeAnchor.x, 0, enzymeAnchor.z);
        if (radial.lengthSq() < 0.0001) radial.set(1, 0, 0);
        radial.normalize();
        enzyme.position.copy(enzymeAnchor).addScaledVector(radial, 2.2 * unwind);
        enzyme.lookAt(enzyme.position.clone().add(radial));
        enzyme.scale.setScalar(0.55 + unwind * 0.55);
        deaminaseMaterial.color.set(current.editorColor);
        deaminaseMaterial.emissive.set(current.editorColor);
        deaminaseMaterial.emissiveIntensity = 0.6 + Math.sin(performance.now() * 0.004) * 0.35;
      }

      // Ganz langsame Eigendrehung, damit die Helix als Körper lesbar bleibt.
      if (pointers.size === 0) cameraState.theta += delta * 0.06;

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

    apiRef.current = {
      dispose: () => {
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
      },
    };

    return () => {
      apiRef.current?.dispose();
      apiRef.current = null;
    };
    // Die Szene wird genau einmal aufgebaut; alle Aktualisierungen laufen über propsRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mountRef} className="h-full w-full" aria-hidden="true" />;
}
