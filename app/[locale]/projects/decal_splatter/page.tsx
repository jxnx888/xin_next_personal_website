import type { Metadata } from 'next';
import DecalSplatterLoader from './DecalSplatterLoader';

export const metadata: Metadata = {
  title: 'Decal Splatter — 3D Luggage Customizer',
  description: 'Interactive 3D decal placement tool — click the luggage to apply stickers, adjust size and rotation.',
};

export default function DecalSplatterPage() {
  return <DecalSplatterLoader />;
}
