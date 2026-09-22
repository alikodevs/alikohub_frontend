import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Globe, Award, Users } from "lucide-react";
import aboutTeam from "@/assets/about-team.jpg";

const values = [
  {
    icon: Heart,
    title: "Client-Centered",
    desc: "Every decision we make starts with your goals.",
    style: "card-navy-subtle",
  },
  {
    icon: Globe,
    title: "Globally Connected",
    desc: "Partnerships and insights spanning continents.",
    style: "card-gold-subtle",
  },
  {
    icon: Award,
    title: "Excellence Driven",
    desc: "We hold ourselves to the highest professional standards.",
    style: "card-teal-subtle",
  },
  {
    icon: Users,
    title: "Approachable Expertise",
    desc: "Premium guidance that feels personal and human.",
    style: "card-forest-subtle",
  },
];

const About = () => (
  <div>
    {/* Hero with Image */}
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${aboutTeam})` }}
      />

      {/* Gradient overlay — readable text without washing out the image */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#061225]/95 via-[#081830]/75 to-[#081830]/30" />

      <div className="relative container-wide px-4 lg:px-8 py-20 md:py-28 lg:py-36">
        <div className="max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D9A441] mb-4 block">
            About Us
          </span>

          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6">
            Who We Are
          </h1>

          <p className="text-white/80 text-lg leading-relaxed max-w-2xl">
            Aliko Consultancy is a premium multi-pillar consultancy dedicated to
            empowering individuals and organizations through expert guidance in
            business, career, and travel advisory.
          </p>
        </div>
      </div>
    </section>

    {/* Story + Mission */}
    <section className="section-padding">
      <div className="container-wide grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="font-serif text-3xl font-bold text-primary mb-6">
            Our Story
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Founded with a passion for helping people navigate life's biggest
            transitions, Aliko Consultancy brings together seasoned
            professionals from business strategy, career development, and
            international mobility.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            We believe that with the right guidance, every person and business
            can achieve extraordinary outcomes. Our approach is rooted in deep
            expertise, cultural sensitivity, and a genuine commitment to your
            success.
          </p>
        </div>
        <div className="rounded-xl overflow-hidden shadow-lg">
          <img
            src={aboutTeam}
            alt="Aliko Consultancy team"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </section>

    {/* Mission & Vision Cards */}
    <section className="section-padding bg-warm-beige">
      <div className="container-wide">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-navy rounded-xl p-10">
            <h3 className="font-serif text-xl font-semibold text-primary-foreground mb-4">
              Our Mission
            </h3>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              To provide world-class consultancy services that empower
              individuals and organizations to achieve their goals with clarity,
              confidence, and lasting impact.
            </p>
          </div>
          <div className="card-forest rounded-xl p-10">
            <h3 className="font-serif text-xl font-semibold text-primary-foreground mb-4">
              Our Vision
            </h3>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              To be the most trusted consultancy partner for those seeking to
              transform their businesses, careers, and global journeys.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="section-padding bg-gradient-cool">
      <div className="container-wide">
        <h2 className="font-serif text-3xl font-bold text-primary mb-10 text-center">
          Our Values
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v) => (
            <div
              key={v.title}
              className={`${v.style} rounded-xl p-6 text-center card-hover`}
            >
              <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-4">
                <v.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-primary mb-2">
                {v.title}
              </h3>
              <p className="text-muted-foreground text-sm">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-navy" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--gold)) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative container-narrow text-center section-padding">
        <h2 className="font-serif text-3xl font-bold text-primary-foreground mb-4">
          Let's Work Together
        </h2>
        <p className="text-primary-foreground/70 mb-8">
          Start a conversation about how we can support your goals.
        </p>
        <Link to="/book">
          <Button className="bg-gold text-navy hover:bg-gold/90 font-semibold px-8 py-6">
            Book Consultation
          </Button>
        </Link>
      </div>
    </section>
  </div>
);

export default About;
