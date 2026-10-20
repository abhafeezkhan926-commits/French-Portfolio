import { BarChart3, Compass, Laptop, Leaf, Network, Stethoscope } from 'lucide-react';

const visuals = {
  'printer-store': { icon: Laptop, code: '01', line1: 'SMART', line2: 'COMMERCE', stat: 'STORE / 24', className: 'art-printer' },
  travel: { icon: Compass, code: '02', line1: 'FIND YOUR', line2: 'NEXT PLACE', stat: 'TRAVEL / 08', className: 'art-travel' },
  'power-bi': { icon: BarChart3, code: '03', line1: 'DATA →', line2: 'DECISIONS', stat: 'INSIGHTS / BI', className: 'art-power' },
  sponsorship: { icon: Network, code: '04', line1: 'BETTER', line2: 'PARTNERSHIPS', stat: 'SPONSOR / MGMT', className: 'art-sponsor' },
  solar: { icon: Leaf, code: '05', line1: 'ENERGY', line2: 'FOR TOMORROW', stat: 'SOLAR / TECH', className: 'art-solar' },
  healthcare: { icon: Stethoscope, code: '06', line1: 'CARE', line2: 'MEETS DIGITAL', stat: 'PHARMA / CARE', className: 'art-health' },
  other: { icon: Laptop, code: '00', line1: 'DIGITAL', line2: 'SOLUTION', stat: 'WEB / DATA', className: 'art-other' }
};

export default function ProjectArtwork({ project, compact = false }) {
  const item = visuals[project?.category] || visuals.other;
  const Icon = item.icon;
  return <div className={`project-art ${item.className} ${compact ? 'project-art-compact' : ''}`}>
    <div className="art-grain" />
    <div className="art-meta"><span>LM—{item.code}</span><span>{item.stat}</span></div>
    <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
    <div className="art-shape" />
    <div className="art-copy"><span className="art-kicker">WEB / DATA SOLUTIONS</span><strong>{item.line1}<br />{item.line2}</strong></div>
    <div className="art-icon"><Icon size={compact ? 23 : 34} strokeWidth={1.4} /></div>
    <span className="art-index">{item.code} / 06</span>
  </div>;
}
