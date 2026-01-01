import { Gamepad2, Twitter, MessageCircle, Github, Youtube } from "lucide-react";

const footerLinks = {
  Platform: ["Features", "Quests", "Leaderboard", "Prizes", "Polls"],
  Community: ["Discord", "Forum", "Events", "Blog", "Support"],
  Company: ["About", "Careers", "Press", "Partners", "Contact"],
  Legal: ["Terms", "Privacy", "Cookies", "Guidelines"],
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: MessageCircle, href: "#", label: "Discord" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

const Footer = () => {
  return (
    <footer className="relative border-t border-border bg-card/30">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2">
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Gamepad2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-gaming font-bold text-lg sm:text-xl text-foreground">
                PHRESH<span className="text-primary">TEAM</span>
              </span>
            </a>
            <p className="text-xs sm:text-sm text-muted-foreground font-cyber mb-6 max-w-xs">
              The ultimate gaming social platform. Connect, compete, and conquer with gamers worldwide.
            </p>
            {/* Social Links */}
            <div className="flex gap-2 sm:gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-gaming text-xs sm:text-sm uppercase tracking-wider text-foreground mb-3 sm:mb-4">
                {title}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-xs sm:text-sm text-muted-foreground hover:text-primary font-cyber transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground font-cyber">
            © 2025 PHRESHTEAMTV. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary font-cyber transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary font-cyber transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
