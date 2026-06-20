import Image from "next/image"

export default function PrivacyPolicyHero() {
  return (
    <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/assets/bg/heroA.png"
          alt="Privacy Policy background"
          fill
          className="object-cover brightness-75"
          priority
        />
      </div>

      {/* Text overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto">
            Your privacy matters to us. Learn how we protect and handle your personal information.
          </p>
        </div>
      </div>
    </section>
  )
}
