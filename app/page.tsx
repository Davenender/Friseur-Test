import Image from "next/image";
import { BookingForm } from "@/components/BookingForm";
import { GiftCardForm } from "@/components/GiftCardForm";
import { EMPLOYEES } from "@/lib/booking";

const services = [
  {
    title: "Trends",
    body: "Die neuesten Trendfrisuren des Jahres – kreiert für Ihren Typ. Sprechen Sie uns einfach an.",
    img: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Coloration",
    body: "Ausgezeichnete Colorationsexperten. Regelmäßige Schulungen und Top-Produkte für Top-Ergebnisse. Kostenlose Beratung inklusive.",
    img: "https://images.unsplash.com/photo-1522337094846-8a818192de1f?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Strähnen",
    body: "Highlights setzen, natürliche Grundfarbe behalten. Harmonisch, vielseitig und auf Ihren Typ zugeschnitten.",
    img: "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Keratinglättung",
    body: "Bis zu 5 Monate dauerhaft glattes Haar. Sichtbares Ergebnis, langer Tragekomfort.",
    img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80",
  },
];

const testimonials = [
  {
    name: "Julia",
    text: "Sehr zufrieden! Gemütlicher kleiner Salon, tolles und freundliches Team. Es wird geschnitten wie man es wünscht, man bekommt nichts aufgeschwätzt und trotzdem immer eine Top Beratung. Macht weiter so!",
  },
  {
    name: "Renate",
    text: "Sehr zufrieden mit dem Haarschnitt. Graziella schneidet super. Man fühlt sich im Salon einfach wohl, ausgezeichnete Beratung.",
  },
  {
    name: "Nicole",
    text: "Rundum zufrieden! Tolle Beratung, super Produkte und endlich wieder schöne und gesunde Haare. Herzlichen Dank!",
  },
];

const gallery = [
  "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1554519515-242161756769?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1605980776566-0486c3ac7617?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80",
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Marquee />
        <About />
        <Team />
        <Services />
        <Unique />
        <Gallery />
        <Reviews />
        <Booking />
        <GiftCard />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-cream-dark/60 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#top" className="flex flex-col leading-tight">
          <span className="font-display text-lg text-ink sm:text-xl">
            Haarstudio <em className="not-italic text-accent-dark">Graziella</em>
          </span>
          <span className="text-[10px] uppercase tracking-[0.25em] text-ink-soft sm:text-[11px]">
            seit 2012 · Mühlheim am Main
          </span>
        </a>
        <nav className="hidden items-center gap-7 text-sm text-ink-soft md:flex">
          <a href="#leistungen" className="hover:text-ink">Leistungen</a>
          <a href="#team" className="hover:text-ink">Team</a>
          <a href="#galerie" className="hover:text-ink">Galerie</a>
          <a href="#rezensionen" className="hover:text-ink">Rezensionen</a>
          <a href="#gutschein" className="hover:text-ink">Gutschein</a>
          <a href="#kontakt" className="hover:text-ink">Kontakt</a>
        </nav>
        <a
          href="#termin"
          className="hidden rounded-full bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-cream transition hover:bg-accent-dark sm:inline-block"
        >
          Termin buchen
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-cream">
      <div className="absolute inset-0 -z-10">
        <Image
          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=2400&q=80"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-cream via-cream/90 to-cream/30" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-12 lg:gap-16 lg:py-36">
        <div className="lg:col-span-7 flex flex-col justify-center fade-up">
          <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-accent-dark ring-1 ring-rose">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Ihr Friseur in Lämmerspiel
          </span>
          <h1 className="font-display text-[2.6rem] leading-[1.05] text-ink sm:text-6xl lg:text-7xl">
            Wo Haarträume
            <br />
            <span className="italic text-accent-dark">wahr werden.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Tauchen Sie ein in die Magie von Haarstudio Graziella – persönliche
            Beratung, präzises Handwerk und ein Ergebnis, das Sie zum Strahlen
            bringt.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#termin"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-8 py-4 text-sm font-semibold uppercase tracking-wider text-cream transition hover:bg-accent-dark"
            >
              Termin online buchen
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
              </svg>
            </a>
            <a
              href="tel:+4961087998 65"
              className="inline-flex items-center justify-center rounded-full bg-white/80 px-8 py-4 text-sm font-semibold text-ink ring-1 ring-cream-dark transition hover:bg-white"
            >
              06108 / 79 98 65
            </a>
          </div>

          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-cream-dark pt-6 text-sm">
            <Stat number="12+" label="Jahre Erfahrung" />
            <Stat number="100%" label="zufriedene Kundinnen" />
            <Stat number="6" label="Tage / Woche geöffnet" />
          </dl>
        </div>

        <div className="relative hidden lg:col-span-5 lg:block">
          <div className="absolute -right-8 top-10 h-[78%] w-[88%] rounded-[2rem] bg-rose/60" />
          <div className="relative h-full w-full overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-white/40">
            <Image
              src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1400&q=80"
              alt="Friseurin bei der Arbeit"
              fill
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-4 left-6 flex items-center gap-3 rounded-2xl bg-white/95 px-5 py-3 shadow-lg ring-1 ring-cream-dark">
            <div className="flex gap-0.5 text-accent">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} />
              ))}
            </div>
            <div className="text-xs text-ink-soft">
              <strong className="text-ink">Top-Bewertungen</strong> auf Facebook
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <dt className="font-display text-2xl text-ink sm:text-3xl">{number}</dt>
      <dd className="mt-1 text-xs uppercase tracking-wider text-ink-soft">
        {label}
      </dd>
    </div>
  );
}

function Marquee() {
  const items = [
    "Schnitt",
    "Coloration",
    "Strähnen",
    "Keratinglättung",
    "Beratung",
    "Pflege",
    "Hochsteckfrisuren",
  ];
  return (
    <div className="overflow-hidden border-y border-cream-dark bg-ink py-5 text-cream">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-2 px-5 text-sm font-display italic text-cream/80 sm:px-8">
        {items.map((it, i) => (
          <span key={it} className="flex items-center gap-10">
            <span>{it}</span>
            {i < items.length - 1 && (
              <span className="text-accent">✦</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function About() {
  return (
    <section id="salon" className="bg-cream py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-5">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-dark">
            Haarstudio Graziella
          </span>
          <h2 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">
            Ihre Reise zum <em className="text-accent-dark">Traumhaar</em> beginnt hier.
          </h2>
          <div className="mt-8 hidden lg:block">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
              <Image
                src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80"
                alt="Salon"
                fill
                sizes="40vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
        <div className="lg:col-span-7 lg:pt-14">
          <p className="font-display text-2xl italic leading-relaxed text-ink-soft sm:text-3xl">
            &bdquo;Stellen Sie sich vor, Sie verlassen unseren Salon mit einer
            Frisur, die nicht nur Ihr Äußeres, sondern auch Ihr Inneres
            strahlen lässt.&ldquo;
          </p>
          <div className="mt-10 grid gap-6 text-base leading-relaxed text-ink-soft sm:text-lg">
            <p>
              Lernen Sie unser engagiertes, freundliches Team kennen und
              lassen Sie sich von den aktuellsten Frisurentrends inspirieren.
              Unsere Experten stehen bereit, Sie individuell zu beraten.
            </p>
            <p>
              Gönnen Sie sich eine Auszeit und erleben Sie unser exquisites
              Wohlfühlprogramm. Jeder Besuch bei uns wird zu einem einzigartigen
              Erlebnis – persönlich, präzise und mit Liebe zum Detail.
            </p>
            <p className="font-display text-xl text-ink">
              Herzlichst, Ihr Team von Haarstudio Graziella.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Team() {
  return (
    <section id="team" className="bg-cream-dark/30 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-14 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-dark">
            Unser Team
          </span>
          <h2 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
            Die Hände hinter <em className="text-accent-dark">Ihrem Look</em>.
          </h2>
          <p className="mt-5 text-lg text-ink-soft">
            Wählen Sie bei der Buchung Ihre Wunsch-Mitarbeiterin – oder
            überlassen Sie uns die Wahl.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:max-w-4xl">
          {EMPLOYEES.map((e) => (
            <article
              key={e.id}
              className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-cream-dark transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={e.photo}
                  alt={e.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex items-center justify-between gap-3 p-6">
                <div>
                  <h3 className="font-display text-2xl text-ink">{e.name}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{e.role}</p>
                </div>
                <a
                  href="#termin"
                  className="shrink-0 rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cream transition hover:bg-accent-dark"
                >
                  Termin
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section id="leistungen" className="bg-cream-dark/40 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-14 flex flex-col items-end justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-dark">
              Unsere Leistungen
            </span>
            <h2 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
              Handwerk, das Sie <em className="text-accent-dark">spüren</em>.
            </h2>
          </div>
          <a
            href="#termin"
            className="text-sm font-semibold uppercase tracking-wider text-accent-dark underline underline-offset-8 hover:text-ink"
          >
            Termin anfragen →
          </a>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => (
            <article
              key={s.title}
              className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-cream-dark transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={s.img}
                  alt={s.title}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-cream font-display text-sm text-accent-dark">
                  {String(i + 1).padStart(2, "0")}
                </div>
              </div>
              <div className="flex grow flex-col p-6">
                <h3 className="font-display text-2xl text-ink">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {s.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Unique() {
  return (
    <section className="relative overflow-hidden bg-cream py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-cream-dark">
            <Image
              src="https://images.unsplash.com/photo-1532710093739-9470acff878f?auto=format&fit=crop&w=1200&q=80"
              alt="Salon Atmosphäre"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute hidden lg:block lg:-mt-20 lg:ml-[28%]">
            <div className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-cream-dark">
              <div className="font-display text-3xl text-ink">★ ★ ★ ★ ★</div>
              <div className="mt-1 text-sm text-ink-soft">
                Bewertet von unseren Kundinnen
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-7">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-dark">
            Was uns einzigartig macht
          </span>
          <h2 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
            Sie stehen im <em className="text-accent-dark">Fokus</em>.
          </h2>
          <p className="mt-7 text-lg leading-relaxed text-ink-soft">
            Bei uns bekommen Sie nicht einfach nur einen Haarschnitt. Jeder
            Kunde ist einzigartig – und genau so behandeln wir Sie. Wir nehmen
            uns die nötige Zeit, um Sie ausführlich und individuell zu beraten.
          </p>
          <ul className="mt-9 space-y-5">
            {[
              {
                t: "Ehrliche Beratung",
                d: "Es wird geschnitten, wie Sie es wünschen – nichts wird aufgeschwätzt.",
              },
              {
                t: "Top Produkte & Schulungen",
                d: "Regelmäßige Weiterbildung und hochwertige Produkte für sichtbare Ergebnisse.",
              },
              {
                t: "Individuelles Ergebnis",
                d: "Frisuren, die zu Ihrem Typ, Ihrem Alltag und Ihrer Persönlichkeit passen.",
              },
            ].map((it) => (
              <li key={it.t} className="flex items-start gap-4">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose text-accent-dark">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <div className="font-display text-lg text-ink">{it.t}</div>
                  <div className="mt-1 text-ink-soft">{it.d}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Gallery() {
  return (
    <section id="galerie" className="bg-cream-dark/40 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-12 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-dark">
            Galerie
          </span>
          <h2 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
            Vielleicht entdecken Sie genau das Styling für Sie.
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {gallery.map((src, i) => (
            <div
              key={src}
              className={`group relative overflow-hidden rounded-2xl ${
                i === 0 || i === 4 ? "row-span-2 aspect-[3/5]" : "aspect-square"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(min-width: 768px) 33vw, 50vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Reviews() {
  return (
    <section id="rezensionen" className="bg-cream py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-14 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent-dark">
            <GoogleLogo className="h-4 w-4" />
            Google Rezensionen
          </span>
          <h2 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
            Das sagen unsere <em className="text-accent-dark">Kundinnen</em>.
          </h2>
          <div className="mt-5 flex items-center justify-center gap-2 text-ink-soft">
            <div className="flex gap-0.5 text-accent">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} />
              ))}
            </div>
            <span className="text-sm">5,0 · basierend auf Google-Rezensionen</span>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <figure
              key={t.name}
              className={`flex flex-col rounded-3xl p-8 shadow-sm ring-1 ring-cream-dark ${
                i === 1 ? "bg-ink text-cream" : "bg-white"
              }`}
            >
              <div
                className={`mb-5 flex gap-0.5 ${i === 1 ? "text-rose" : "text-accent"}`}
              >
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} />
                ))}
              </div>
              <blockquote
                className={`grow text-lg leading-relaxed ${i === 1 ? "text-cream/90" : "text-ink-soft"}`}
              >
                &bdquo;{t.text}&ldquo;
              </blockquote>
              <figcaption
                className={`mt-6 flex items-center gap-3 font-display text-lg ${i === 1 ? "text-cream" : "text-ink"}`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-display text-base ${
                    i === 1 ? "bg-rose text-ink" : "bg-rose text-accent-dark"
                  }`}
                >
                  {t.name[0]}
                </span>
                {t.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Booking() {
  return (
    <section
      id="termin"
      className="relative bg-cream-dark/40 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-dark">
            Termin buchen
          </span>
          <h2 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
            In drei Schritten zu Ihrem <em className="text-accent-dark">Wunschtermin</em>.
          </h2>
          <p className="mt-5 text-lg text-ink-soft">
            Leistung wählen, freien Slot picken, Daten hinterlegen – Sie
            erhalten eine Bestätigung direkt per E-Mail.
          </p>
        </div>
        <BookingForm />
      </div>
    </section>
  );
}

function GiftCard() {
  return (
    <section id="gutschein" className="relative overflow-hidden bg-cream py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-14 max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-dark">
            Geschenkidee
          </span>
          <h2 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
            Schenken Sie ein <em className="text-accent-dark">Haarerlebnis</em>.
          </h2>
          <p className="mt-5 text-lg text-ink-soft">
            Gutschein wählen, bequem per Stripe bezahlen, sofort per E-Mail
            erhalten – einlösbar bei uns im Salon.
          </p>
        </div>
        <GiftCardForm />
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="kontakt" className="bg-ink py-24 text-cream sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-rose">
            Kontakt
          </span>
          <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
            Wir freuen uns auf Sie.
          </h2>
          <p className="mt-6 max-w-md text-lg text-cream/80">
            Lieber persönlich? Rufen Sie uns an oder kommen Sie spontan vorbei.
          </p>

          <dl className="mt-10 grid gap-6 sm:grid-cols-2">
            <ContactRow label="Adresse">
              Friedrich-Ebert-Str. 8<br />
              63165 Mühlheim am Main
            </ContactRow>
            <ContactRow label="Telefon">
              <a href="tel:+4961087998 65" className="hover:text-rose">
                06108 / 79 98 65
              </a>
            </ContactRow>
            <ContactRow label="E-Mail">
              <a
                href="mailto:kontakt@haarstudio-graziella.de"
                className="hover:text-rose"
              >
                kontakt@haarstudio-graziella.de
              </a>
            </ContactRow>
            <ContactRow label="Öffnungszeiten">
              Mo – Fr: 09:00 – 18:30
              <br />
              Sa: 08:30 – 14:00
            </ContactRow>
          </dl>

          <div className="mt-10 flex gap-3">
            <a
              href="#termin"
              className="inline-flex items-center justify-center rounded-full bg-cream px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-ink transition hover:bg-rose"
            >
              Termin buchen
            </a>
            <a
              href="#gutschein"
              className="inline-flex items-center justify-center rounded-full border border-cream/30 px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-cream transition hover:bg-cream/10"
            >
              Gutschein
            </a>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl ring-1 ring-cream/15">
          <iframe
            title="Standort Haarstudio Graziella"
            src="https://www.google.com/maps?q=Friedrich-Ebert-Str.+8,+63165+M%C3%BChlheim+am+Main&z=16&output=embed"
            className="h-full min-h-[420px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=Friedrich-Ebert-Str.+8%2C+63165+M%C3%BChlheim+am+Main"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-cream px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink shadow-lg transition hover:bg-rose"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.553 2.776A1 1 0 0022 18.882V8.118a1 1 0 00-1.447-.894L15 10m0 7V10m0 0L9 7" />
            </svg>
            Route planen
          </a>
        </div>
      </div>
    </section>
  );
}

function ContactRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-widest text-rose">
        {label}
      </dt>
      <dd className="mt-2 text-cream/90">{children}</dd>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-cream-dark/20 bg-ink py-10 text-cream/70">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 text-sm sm:flex-row sm:px-8">
        <p className="font-display text-base text-cream">
          Haarstudio Graziella
        </p>
        <p>
          © {new Date().getFullYear()} Graziella Faro-Lombardi · Einfach schöne
          Haare
        </p>
      </div>
    </footer>
  );
}

function GoogleLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

function Star() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path d="M9.05 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.366 2.446c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.65 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.05 2.927z" />
    </svg>
  );
}
