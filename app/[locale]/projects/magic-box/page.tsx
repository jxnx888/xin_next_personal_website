import type { Metadata } from 'next';
import MagicBoxLoader from './MagicBoxLoader';

export const metadata: Metadata = {
  title: 'Magic Box — 3D Builder for Kids',
  description: 'Educational 3D builder app — assemble 3D models with geometric and cartoon shapes, then export as STL.',
};

export default function MagicBoxPage() {
  return <MagicBoxLoader />;
}
