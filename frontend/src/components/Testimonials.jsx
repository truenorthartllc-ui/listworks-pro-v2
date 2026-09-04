import useTranslation from "@/hooks/useTranslation";

export default function Testimonials() {
  const { t } = useTranslation();
  return (
    <section data-testid="testimonials-section" className="bg-white border-b border-ink/15">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16 text-center">
        <p className="font-display italic text-lg md:text-xl text-ink/70 leading-relaxed max-w-2xl mx-auto">
          {t("testimonials.text")}
        </p>
      </div>
    </section>
  );
}
