"use client";
import {
  PROVIDER_CONFIGS,
  ALL_VECTOR_STORES,
  FULLTEXT_SEARCH_TOOLS,
} from "@gaia/ai/const";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ProviderIcon } from "./provider-icons";

export function ProvidersSection() {
  const [providers, setProviders] = useState<
    Array<{ id: string; name: string }>
  >([]);

  useEffect(() => {
    // Combine all providers and shuffle randomly
    const allProviders = [
      ...PROVIDER_CONFIGS,
      ...ALL_VECTOR_STORES,
      ...FULLTEXT_SEARCH_TOOLS,
    ];

    // Shuffle array
    const shuffled = [...allProviders].sort(() => Math.random() - 0.5);

    // Take random subset (optional - adjust count as needed)
    const selected = shuffled; // .slice(0, Math.min(12, shuffled.length));

    setProviders(selected);
  }, []);

  // Triple the providers for truly seamless loop
  const tripleProviders = [...providers, ...providers, ...providers];

  return (
    <section className="relative py-16 overflow-hidden border-y border-border/30">
      <div className="absolute inset-0 " />

      <div className="mx-auto relative z-10 px-4">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-muted-foreground mb-8"
        >
          Trusted by developers building with the best AI infrastructure
        </motion.p>

        {/* Logo Marquee */}
        <div className="relative overflow-hidden max-w-4xl mx-auto">
          <div className="flex gap-12 animate-marquee">
            {tripleProviders.map((provider, index) => (
              <div
                key={`${provider.id}-${index}`}
                className="shrink-0 flex items-center gap-3 group cursor-pointer"
              >
                <div className=" transition-all duration-300 group-hover:scale-110 group-hover:brightness-110">
                  <ProviderIcon provider={provider.id} />
                </div>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300 whitespace-nowrap">
                  {provider.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .provider-icon:hover {
          filter: drop-shadow(0 0 1rem rgba(100, 108, 255, 0.4));
        }

        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-33.333%);
          }
        }

        .animate-marquee {
          animation: marquee 13s linear infinite;
        }

        .animate-marquee:hover {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-marquee {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
// <section className="py-12 overflow-hidden max-w-7xl mx-auto">
//     <div className="mx-auto px-6">
//       <div className="relative">
//         <div className="flex gap-8 md:gap-12 animate-infinite-scroll">
//           {tripleProviders.map((provider, index) => (
//             <div
//               key={`${provider.id}-${index}`}
//               className="shrink-0 flex  items-center gap-3 group cursor-pointer"
//             >
//               <div className="transition-all duration-300 group-hover:scale-110 group-hover:brightness-110">
//                 <ProviderIcon provider={provider.id} />
//               </div>
//               <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300 whitespace-nowrap">
//                 {provider.name}
//               </span>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>

//     <style jsx>{`
//       @keyframes infinite-scroll {
//         from {
//           transform: translateX(0);
//         }
//         to {
//           transform: translateX(-33.333%);
//         }
//       }

//       .animate-infinite-scroll {
//         animation: infinite-scroll 13s linear infinite;
//         will-change: transform;
//       }

//       .animate-infinite-scroll:hover {
//         animation-play-state: paused;
//       }
//     `}</style>
//   </section>
