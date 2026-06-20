"use client"
import { Shield, Users, Mail, CreditCard, ShoppingBag, MousePointer, Trash2 } from 'lucide-react'

export default function PrivacyPolicy() {
  const sections = [
    {
      id: 1,
      title: "Your Privacy",
      icon: <Shield className="w-6 h-6 text-pink-600" />,
      content: "We are deeply committed to safeguarding your personal information and earning your trust. Your privacy is important to us, and this policy outlines how we collect, use, and protect your data. While we aim to comply with global privacy standards, we cannot guarantee compliance with every international law. We strive to protect your rights within systems and digital spaces controlled by us. However, we are not responsible for data misuse or unauthorized disclosures by third-party entities such as advertisers or external websites linked to our platform. Please note that the privacy practices of such external websites may differ from ours. This privacy policy may be updated periodically, and we encourage you to review it regularly."
    },
    {
      id: 2,
      title: "Privacy Assurance",
      icon: <Users className="w-6 h-6 text-pink-600" />,
      content: "Lia Fashion does not sell, rent, or trade your personal information to third parties. We may share your data only with trusted partners, agents, or service providers to fulfill services you request. These third parties are obligated to maintain confidentiality and follow data protection laws."
    },
    {
      id: 3,
      title: "Electronic Communication",
      icon: <Mail className="w-6 h-6 text-pink-600" />,
      content: "By interacting with our Website, sending emails, or providing feedback, you consent to receive communications from us electronically. You agree that any notices, agreements, and communications we send to you electronically fulfill any legal requirements for written communication."
    },
    {
      id: 4,
      title: "Payment and Account Information",
      icon: <CreditCard className="w-6 h-6 text-pink-600" />,
      content: "We store your account and billing history (including payment details and related communication) in encrypted form on secure servers. This ensures your data is protected and only accessible to authorized personnel."
    },
    {
      id: 5,
      title: "Transactional Information",
      icon: <ShoppingBag className="w-6 h-6 text-pink-600" />,
      content: "We may collect non-banking transactional history related to your shopping activities on our Website to improve service offerings and user experience."
    },
    {
      id: 6,
      title: "Service Usage",
      icon: <MousePointer className="w-6 h-6 text-pink-600" />,
      content: "We collect data on how you interact with our services, including the URLs you visit and products you engage with. This helps us personalize your experience and enhance our website performance."
    },
    {
      id: 7,
      title: "Deletion of Data",
      icon: <Trash2 className="w-6 h-6 text-pink-600" />,
      content: "We will store and process your personal data only as long as necessary and in accordance with applicable data protection laws. You may request data deletion, and we will act on it as required under legal obligations."
    }
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-600">
            We at Lia Fashion take your privacy and security seriously. Our goal is to provide you with a safe, seamless shopping experience. Please review the following policy to understand how your personal information is treated when using our services. By accessing our Website, you agree to the terms described below.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-pink-50 rounded-lg">
                  {section.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">{section.title}</h2>
                  <p className="text-gray-600 leading-relaxed">{section.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
