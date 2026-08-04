"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  CreditCard,
  Building2,
  Users,
  Stethoscope,
  FlaskConical,
  Scan,
  Pill,
  Landmark,
  Briefcase,
  Shield,
  Video,
  Globe,
  BarChart3,
  ArrowRight,
  Check,
  ChevronDown,
  Menu,
  X,
  Lock,
  Keyboard,
  Phone,
  Mail,
  MapPin,
  Activity,
  HeartPulse,
  Wifi,
} from "lucide-react";

/* ────────────────────────────────────────────────── */
/*  DATA                                              */
/* ────────────────────────────────────────────────── */

const stats = [
  { value: "14+", label: "Integrated Modules" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "<300ms", label: "Response Time" },
  { value: "∞", label: "Scalable Tenants" },
];

const features = [
  { icon: UserPlus, title: "Self-Service Onboarding", desc: "Register your hospital, verify documents, and go live — no IT team needed." },
  { icon: CreditCard, title: "Subscription Management", desc: "Flexible plans with metered quotas and automated billing." },
  { icon: Building2, title: "Multi-Branch Operations", desc: "Manage all your branches under one unified organization." },
  { icon: Users, title: "Patient Management", desc: "Registration, appointment scheduling, and queue management." },
  { icon: Stethoscope, title: "Electronic Medical Records", desc: "Structured clinical documentation with diagnostic coding." },
  { icon: FlaskConical, title: "Laboratory Management", desc: "Full order-to-result lifecycle with analyzer integration." },
  { icon: Scan, title: "Radiology & Imaging", desc: "Order-to-report workflow with DICOM viewer linkage." },
  { icon: Pill, title: "Pharmacy & POS", desc: "Inventory, dispensing, expiry tracking, and point-of-sale." },
  { icon: Landmark, title: "Financial Accounting", desc: "Double-entry accounting with revenue analytics and reconciliation." },
  { icon: Briefcase, title: "HR & Payroll", desc: "Attendance, leave management, and automated payroll processing." },
  { icon: Shield, title: "Insurance & Billing", desc: "Claims processing, corporate contracts, and billing automation." },
  { icon: Video, title: "Telemedicine", desc: "Virtual consultations for remote patient care." },
  { icon: Globe, title: "Patient Portal", desc: "Cross-tenant health record portability under explicit consent." },
  { icon: BarChart3, title: "Analytics & Reporting", desc: "Comprehensive dashboards and insights across all modules." },
];

const steps = [
  { num: "01", title: "Sign Up & Verify", desc: "Register your organization, upload verification documents, and complete payment setup." },
  { num: "02", title: "Configure & Customize", desc: "Set up branches, departments, staff roles, permissions, and clinical workflows." },
  { num: "03", title: "Go Live", desc: "Start managing patients, labs, pharmacy, and finances from day one." },
];

const benefits = [
  { icon: Globe, title: "Built for Bangladesh", desc: "Native Bangla & English support, bKash / Nagad / SSLCommerz payments, and local compliance." },
  { icon: Lock, title: "Cloud-Native & Secure", desc: "No on-premise servers needed. Automatic updates, full audit trails, and soft-delete compliance." },
  { icon: Keyboard, title: "Keyboard-First Design", desc: "Optimized for high-volume users — receptionists, nurses, pharmacists — with minimal clicks." },
  { icon: Wifi, title: "Low-Bandwidth Ready", desc: "Fully functional at 512 kbps with 300 ms latency. Designed for real-world Bangladesh networks." },
];

const faqs = [
  { q: "What types of healthcare facilities can use Meditek?", a: "Meditek is designed for hospitals, diagnostic centers, clinics, and multi-branch healthcare organizations. Whether you are a single-branch clinic or a large hospital network, Meditek scales to fit your operations." },
  { q: "How does multi-tenant data isolation work?", a: "Each tenant (organization) has its own isolated data plane. Patient records, financial data, and clinical documents are strictly separated. The control plane manages shared services like billing and feature flags without exposing tenant data." },
  { q: "Can I migrate data from existing systems?", a: "Yes. We provide migration tools and support for importing patient records, financial data, and staff information from legacy systems, spreadsheets, or other hospital management software." },
  { q: "What happens during internet outages?", a: "While Meditek is a web-first platform, it is designed to be resilient on unstable connections. Critical workflows are optimized for low-bandwidth scenarios, and we are developing offline-mode support for future versions." },
  { q: "Does Meditek support Bangla language?", a: "Absolutely. Bangla and English are both supported from day one. The entire data layer is locale-agnostic, meaning you can operate in either language seamlessly across all modules." },
];

const testimonials = [
  { name: "Dr. Rafiq Hassan", role: "Director, City General Hospital", quote: "Meditek transformed how we manage our 3-branch operation. The unified dashboard gives us real-time visibility across every department." },
  { name: "Fatema Begum", role: "Lab Manager, Dhaka Diagnostics", quote: "The lab module's analyzer integration saved us hours of manual data entry every day. Sample tracking is now completely automated." },
  { name: "Kamal Uddin", role: "Hospital Administrator", quote: "Moving from paper records to Meditek was seamless. The onboarding process took less than a week, and the support team was exceptional." },
];

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#" },
    { label: "Integrations", href: "#" },
    { label: "Changelog", href: "#" },
    { label: "Documentation", href: "#" },
  ],
  Company: [
    { label: "About Us", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Press", href: "#" },
    { label: "Partners", href: "#" },
  ],
  Resources: [
    { label: "Help Center", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Status", href: "#" },
    { label: "Security", href: "#" },
    { label: "Community", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "Data Processing", href: "#" },
  ],
};

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Why Meditek", href: "#why-meditek" },
  { label: "FAQ", href: "#faq" },
];

/* ────────────────────────────────────────────────── */
/*  ANIMATION HELPERS                                 */
/* ────────────────────────────────────────────────── */

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

function Section({ children, className = "", id }) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function FloatingIcon({ icon: Icon, className, delay = 0, duration = 6, yOffset = 20, rotate = 0 }) {
  return (
    <motion.div
      animate={{ y: [0, -yOffset, 0], rotate: [rotate, rotate + 10, rotate - 10, rotate] }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      className={`absolute opacity-[0.08] pointer-events-none ${className}`}
    >
      <Icon className="w-full h-full text-teal-700" />
    </motion.div>
  );
}

/* ────────────────────────────────────────────────── */
/*  HEADER                                            */
/* ────────────────────────────────────────────────── */

function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <HeartPulse className="h-8 w-8 text-teal-600" strokeWidth={2.5} />
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Medi<span className="text-teal-600">tek</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex lg:gap-x-10">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:flex lg:items-center lg:gap-x-4">
          <Link
            href="/auth/tenant-login"
            className="text-sm font-semibold text-slate-700 hover:text-teal-600 transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/auth/registration"
            className="text-sm font-semibold bg-teal-600 text-white px-5 py-2.5 rounded-xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/25 hover:shadow-teal-600/40"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="lg:hidden p-2 cursor-pointer" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6 text-slate-700" /> : <Menu className="h-6 w-6 text-slate-700" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden overflow-hidden border-t border-gray-100"
          >
            <div className="px-6 py-4 space-y-3 bg-white">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block text-sm font-medium text-slate-600 py-2 hover:text-teal-600"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                <Link
                  href="/auth/tenant-login"
                  className="text-center text-sm font-semibold text-slate-700 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/registration"
                  className="text-center text-sm font-semibold bg-teal-600 text-white py-2.5 rounded-xl hover:bg-teal-700"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ────────────────────────────────────────────────── */
/*  HERO                                              */
/* ────────────────────────────────────────────────── */

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Ambient glow */}
      <motion.div
        animate={{ y: [0, -20, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-teal-50 blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, 15, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 -left-32 w-80 h-80 rounded-full bg-cyan-50 blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 right-1/4 w-72 h-72 rounded-full bg-emerald-50 blur-3xl pointer-events-none"
      />

      {/* Floating Medical Icons */}
      <FloatingIcon icon={Stethoscope} className="top-24 left-[10%] w-20 h-20" delay={0} duration={8} rotate={-15} />
      <FloatingIcon icon={HeartPulse} className="top-40 right-[15%] w-24 h-24" delay={1} duration={10} rotate={10} />
      <FloatingIcon icon={Pill} className="bottom-40 left-[15%] w-16 h-16" delay={2} duration={7} rotate={45} />
      <FloatingIcon icon={FlaskConical} className="bottom-32 right-[20%] w-20 h-20" delay={0.5} duration={9} rotate={-20} />
      <FloatingIcon icon={Scan} className="top-1/2 left-[5%] w-16 h-16" delay={1.5} duration={11} rotate={5} />
      <FloatingIcon icon={Users} className="top-1/3 right-[5%] w-20 h-20" delay={2.5} duration={8} rotate={-10} />

      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 lg:pt-32 lg:pb-40 lg:px-8">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center max-w-4xl mx-auto">
          {/* Pill badge */}
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-teal-100"
          >
            <Activity className="h-4 w-4" />
            Cloud-Native Healthcare Platform
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1.08]">
            The Future of{" "}
            <span className="bg-gradient-to-r from-teal-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
              Healthcare
            </span>{" "}
            Management
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={fadeInUp} className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            All-in-one SaaS platform that unifies hospital operations, diagnostics, pharmacy, and patient care — purpose-built for
            Bangladesh.
          </motion.p>

          {/* CTA */}
          <motion.div variants={fadeInUp} className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/registration"
              className="inline-flex items-center gap-2 bg-teal-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/25 hover:shadow-teal-600/40 hover:-translate-y-0.5"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 bg-white text-slate-700 font-semibold px-8 py-3.5 rounded-xl border-2 border-gray-200 hover:border-teal-300 hover:text-teal-600 transition-all hover:-translate-y-0.5"
            >
              Explore Features
            </a>
          </motion.div>

          {/* Trust pills */}
          <motion.div variants={fadeInUp} className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-teal-500" /> No credit card required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-teal-500" /> 14-day free trial
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-teal-500" /> Cancel anytime
            </span>
          </motion.div>
        </motion.div>

        {/* ── Dashboard mockup ── */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="mt-20 relative mx-auto max-w-5xl"
        >
          <div className="rounded-2xl bg-white shadow-2xl shadow-teal-900/10 border border-gray-200 overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="h-6 bg-gray-200 rounded-lg max-w-xs mx-auto flex items-center justify-center">
                  <span className="text-[10px] text-gray-400 font-medium">app.meditek.com.bd/dashboard</span>
                </div>
              </div>
            </div>

            {/* Dashboard wireframe */}
            <div className="p-5 md:p-6 bg-gradient-to-b from-gray-50/80 to-white min-h-[280px]">
              <div className="flex gap-4">
                {/* Sidebar wireframe */}
                <div className="hidden md:flex flex-col w-44 space-y-2.5 pr-4 border-r border-gray-100">
                  <div className="h-8 bg-teal-100 rounded-lg" />
                  <div className="h-5 bg-gray-100 rounded w-3/4" />
                  <div className="h-5 bg-gray-100 rounded w-5/6" />
                  <div className="h-5 bg-teal-50 rounded border border-teal-200" />
                  <div className="h-5 bg-gray-100 rounded w-4/5" />
                  <div className="h-5 bg-gray-100 rounded w-2/3" />
                  <div className="h-5 bg-gray-100 rounded w-3/4" />
                  <div className="mt-auto h-5 bg-gray-50 rounded w-1/2" />
                </div>

                {/* Main content wireframe */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="h-[72px] bg-teal-50 rounded-xl border border-teal-100 p-3">
                      <div className="h-2 bg-teal-200 rounded w-1/2 mb-2" />
                      <div className="h-4 bg-teal-300 rounded w-2/3" />
                    </div>
                    <div className="h-[72px] bg-cyan-50 rounded-xl border border-cyan-100 p-3">
                      <div className="h-2 bg-cyan-200 rounded w-1/2 mb-2" />
                      <div className="h-4 bg-cyan-300 rounded w-2/3" />
                    </div>
                    <div className="h-[72px] bg-emerald-50 rounded-xl border border-emerald-100 p-3">
                      <div className="h-2 bg-emerald-200 rounded w-1/2 mb-2" />
                      <div className="h-4 bg-emerald-300 rounded w-2/3" />
                    </div>
                    <div className="h-[72px] bg-violet-50 rounded-xl border border-violet-100 p-3">
                      <div className="h-2 bg-violet-200 rounded w-1/2 mb-2" />
                      <div className="h-4 bg-violet-300 rounded w-2/3" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 h-40 bg-gray-50 rounded-xl border border-gray-100 p-4">
                      <div className="h-3 bg-gray-200 rounded w-1/3 mb-4" />
                      <div className="flex items-end gap-2 h-24">
                        {[40, 65, 50, 80, 60, 90, 72, 55, 85, 45, 70, 88].map((h, i) => (
                          <div key={i} className="flex-1 bg-teal-200 rounded-t" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                    <div className="h-40 bg-gray-50 rounded-xl border border-gray-100 p-4">
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-teal-400" />
                          <div className="h-2 bg-gray-200 rounded flex-1" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-cyan-400" />
                          <div className="h-2 bg-gray-200 rounded flex-1 w-4/5" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-emerald-400" />
                          <div className="h-2 bg-gray-200 rounded flex-1 w-3/5" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-amber-400" />
                          <div className="h-2 bg-gray-200 rounded flex-1 w-1/2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Glow under the mockup */}
          <div className="absolute -inset-6 bg-gradient-to-r from-teal-400/20 via-cyan-400/20 to-emerald-400/20 rounded-3xl blur-3xl -z-10" />
        </motion.div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────── */
/*  STATS BAR                                         */
/* ────────────────────────────────────────────────── */

function StatsSection() {
  return (
    <Section className="bg-slate-900 py-14">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <motion.div key={i} variants={fadeInUp}>
              <div className="text-3xl md:text-4xl font-black text-white">{s.value}</div>
              <div className="mt-1 text-sm text-slate-400 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

/* ────────────────────────────────────────────────── */
/*  FEATURES                                          */
/* ────────────────────────────────────────────────── */

function FeaturesSection() {
  return (
    <Section id="features" className="relative py-24 bg-white overflow-hidden">
      {/* Background Floating Icons */}
      <FloatingIcon icon={Shield} className="top-20 left-[5%] w-32 h-32 opacity-[0.03]" delay={0} duration={12} rotate={-15} />
      <FloatingIcon icon={BarChart3} className="bottom-20 right-[5%] w-40 h-40 opacity-[0.03]" delay={2} duration={15} rotate={15} />
      
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 z-10">
        <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Comprehensive Platform</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            14 Integrated Modules,
            <br />
            One Unified Platform
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Everything your healthcare facility needs — from patient registration to financial reporting — seamlessly connected.
          </p>
        </motion.div>

        <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="relative group p-6 bg-white rounded-2xl border border-gray-100 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-600/5 transition-all duration-300 cursor-default overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300 pointer-events-none">
                <f.icon className="w-24 h-24 text-teal-700 -rotate-12" />
              </div>
              
              <div className="relative z-10 h-12 w-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4 group-hover:bg-teal-100 transition-colors">
                <f.icon className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="relative z-10 font-bold text-slate-900 mb-1.5">{f.title}</h3>
              <p className="relative z-10 text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

/* ────────────────────────────────────────────────── */
/*  HOW IT WORKS                                      */
/* ────────────────────────────────────────────────── */

function HowItWorksSection() {
  return (
    <Section id="how-it-works" className="py-24 bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Get Started</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Go Live in 3 Steps</h2>
          <p className="mt-4 text-lg text-slate-600">
            From sign-up to your first patient — get operational in days, not months.
          </p>
        </motion.div>

        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-teal-200 via-cyan-200 to-emerald-200" />

          {steps.map((s, i) => (
            <motion.div key={i} variants={fadeInUp} className="relative text-center">
              <div className="relative z-10 inline-flex items-center justify-center h-24 w-24 rounded-3xl bg-white shadow-lg shadow-teal-100 border border-teal-50 mb-6">
                <span className="text-3xl font-black bg-gradient-to-br from-teal-600 to-cyan-500 bg-clip-text text-transparent">
                  {s.num}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{s.title}</h3>
              <p className="text-slate-600 max-w-xs mx-auto">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

/* ────────────────────────────────────────────────── */
/*  WHY MEDITEK                                       */
/* ────────────────────────────────────────────────── */

function WhyMeditekSection() {
  return (
    <Section id="why-meditek" className="relative py-24 bg-white overflow-hidden">
      <FloatingIcon icon={Globe} className="top-10 left-[40%] w-64 h-64 opacity-[0.02]" delay={1} duration={20} rotate={20} />
      
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left – heading */}
          <motion.div variants={fadeInUp}>
            <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Why Meditek</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Purpose-Built for
              <br />
              Bangladesh Healthcare
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-lg">
              Meditek is not a generic hospital tool — it is designed from the ground up for the unique challenges of healthcare in
              Bangladesh.
            </p>

            <div className="mt-8">
              <Link
                href="/auth/registration"
                className="inline-flex items-center gap-2 bg-teal-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/25 hover:shadow-teal-600/40 hover:-translate-y-0.5"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          {/* Right – benefit cards */}
          <motion.div variants={stagger} className="space-y-5">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ x: 4, transition: { duration: 0.2 } }}
                className="flex gap-4 p-5 rounded-2xl bg-slate-50 hover:bg-teal-50/60 border border-transparent hover:border-teal-100 transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <b.icon className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{b.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

/* ────────────────────────────────────────────────── */
/*  TESTIMONIALS                                      */
/* ────────────────────────────────────────────────── */

function TestimonialsSection() {
  return (
    <Section className="py-24 bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Testimonials</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Trusted by Healthcare Leaders
          </h2>
        </motion.div>

        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="h-5 w-5 text-amber-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>

              <p className="text-slate-600 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

/* ────────────────────────────────────────────────── */
/*  FAQ                                               */
/* ────────────────────────────────────────────────── */

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div variants={fadeInUp} className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
      >
        <span className="font-semibold text-slate-900 pr-4">{faq.q}</span>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-6 text-slate-600 leading-relaxed">{faq.a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FAQSection() {
  return (
    <Section id="faq" className="py-24 bg-white">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">FAQ</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Questions &amp; Answers</h2>
        </motion.div>

        <motion.div variants={stagger} className="space-y-4">
          {faqs.map((faq, i) => (
            <FAQItem key={i} faq={faq} />
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

/* ────────────────────────────────────────────────── */
/*  CTA                                               */
/* ────────────────────────────────────────────────── */

function CTASection() {
  return (
    <section className="relative overflow-hidden">
      {/* Gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-700" />
      {/* Dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1.5' fill='%23ffffff'/%3E%3C/svg%3E")`,
        }}
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="relative mx-auto max-w-4xl px-6 lg:px-8 py-24 text-center"
      >
        <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-black text-white tracking-tight">
          Ready to Transform Your Healthcare Operations?
        </motion.h2>
        <motion.p variants={fadeInUp} className="mt-5 text-lg text-teal-100 max-w-2xl mx-auto">
          Join healthcare facilities across Bangladesh that trust Meditek to manage their operations, patients, and growth.
        </motion.p>
        <motion.div variants={fadeInUp} className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/auth/registration"
            className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold px-8 py-3.5 rounded-xl hover:bg-teal-50 transition-all shadow-lg hover:-translate-y-0.5"
          >
            Start Free Trial
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="mailto:hello@meditek.com.bd"
            className="inline-flex items-center gap-2 text-white font-semibold px-8 py-3.5 rounded-xl border-2 border-white/30 hover:border-white/60 hover:bg-white/10 transition-all hover:-translate-y-0.5"
          >
            Contact Sales
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ────────────────────────────────────────────────── */
/*  FOOTER                                            */
/* ────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-16 pb-8">
        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand col */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <HeartPulse className="h-7 w-7 text-teal-400" strokeWidth={2.5} />
              <span className="text-xl font-black text-white">
                Medi<span className="text-teal-400">tek</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-6 max-w-xs">
              Cloud-native healthcare management platform — purpose-built for hospitals and diagnostic centers in Bangladesh.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0" /> hello@meditek.com.bd
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0" /> +880 1XXXXXXXXX
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 shrink-0" /> Dhaka, Bangladesh
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm hover:text-teal-400 transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-14 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h4 className="text-white font-semibold mb-1">Subscribe to our newsletter</h4>
            <p className="text-sm">Get the latest updates on healthcare technology and Meditek features.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full md:w-64 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
            <button className="px-6 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-500 transition-colors whitespace-nowrap cursor-pointer">
              Submit
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} Meditek. All rights reserved.</p>
          <div className="flex gap-5">
            {["Twitter", "LinkedIn", "Facebook", "YouTube"].map((s) => (
              <a key={s} href="#" className="hover:text-teal-400 transition-colors">
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ────────────────────────────────────────────────── */
/*  PAGE EXPORT                                       */
/* ────────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <WhyMeditekSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}