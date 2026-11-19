import { Mail, MapPin, Phone } from 'lucide-react';
import type { ActiveRoute } from '../../types';

interface FooterProps {
  onNavigate: (route: ActiveRoute, options?: { category?: string }) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#1F2B23] text-[#FBFAF5] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/15">
          <div className="space-y-4">
            <h3 className="font-display text-2xl font-bold text-white">Krishi Market</h3>
            <p className="text-sm text-[#FBFAF5]/75 leading-relaxed">
              Direct farmer-to-consumer agricultural marketplace connecting verified Karnataka farms
              with households across Bengaluru, Mysuru, Mandya, Ramanagara, and Kolar.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Marketplace</h4>
            <ul className="space-y-2.5 text-sm text-[#FBFAF5]/75">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="hover:text-[#DFF0C8] transition-colors cursor-pointer"
                >
                  Browse Fresh Produce
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('shop', { category: 'Vegetables' })}
                  className="hover:text-[#DFF0C8] transition-colors cursor-pointer"
                >
                  Farm Vegetables
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('shop', { category: 'Dairy Products' })}
                  className="hover:text-[#DFF0C8] transition-colors cursor-pointer"
                >
                  A2 Dairy & Bilona Ghee
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('shop', { category: 'Grains and Cereals' })}
                  className="hover:text-[#DFF0C8] transition-colors cursor-pointer"
                >
                  Heirloom Grains & Millets
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Community</h4>
            <ul className="space-y-2.5 text-sm text-[#FBFAF5]/75">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('farmers')}
                  className="hover:text-[#DFF0C8] transition-colors cursor-pointer"
                >
                  Meet Our Farmers
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="hover:text-[#DFF0C8] transition-colors cursor-pointer"
                >
                  Our Direct-Trade Model
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('auth')}
                  className="hover:text-[#DFF0C8] transition-colors cursor-pointer"
                >
                  Become a Partner Farmer
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-[#FBFAF5]/75">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#DFF0C8] shrink-0 mt-0.5" />
                <span>Krishi Bhavan Hub, Indiranagar 2nd Stage, Bengaluru 560008</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#DFF0C8] shrink-0" />
                <span className="tabular-nums">+91 80 4123 8910</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#DFF0C8] shrink-0" />
                <span>hello@krishimarket.in</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FBFAF5]/60">
          <p>© {new Date().getFullYear()} Krishi Market Agri Collective. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <span>Instagram: @krishimarket.in</span>
            <span>WhatsApp Support: +91 98450 11220</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
