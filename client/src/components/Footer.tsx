import { Link } from "wouter";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  const footerSections = [
    {
      title: "Sports",
      links: [
        { name: "NBA", href: "/nba" },
        { name: "NFL", href: "/nfl" },
        { name: "MLB", href: "/mlb" },
        { name: "NHL", href: "/nhl" },
        { name: "Soccer", href: "/soccer" },
      ],
    },
    {
      title: "Features",
      links: [
        { name: "Live Scores", href: "/scores" },
        { name: "AI Summaries", href: "/ai" },
        { name: "Predictions", href: "/predictions" },
        { name: "Personalized Feed", href: "/feed" },
        { name: "Mobile App", href: "/app" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about" },
        { name: "Contact", href: "/contact" },
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Careers", href: "/careers" },
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 text-white py-12 mt-12">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">TSN</h3>
            <p className="text-gray-400 text-sm">
              Smart sports news powered by AI. Get real-time scores, personalized content, and intelligent insights.
            </p>
          </div>
          
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-lg font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="hover:text-white transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© {currentYear} TSN. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <i className="fab fa-youtube"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
