import { createElement } from 'react';
import {
    ShieldCheck,
    Megaphone,
    Landmark,
    Leaf,
    Building2,
    Globe,
    Wind,
    Rocket,
    Castle,
    Swords,
    Handshake,
    Users,
    Church,
    Scale,
    Compass,
    type LucideIcon
} from 'lucide-react';

// Centralized icon registry.
// Product decision: no emoji in the interface (inconsistent rendering across
// platforms, "cheap" feel). Each synthetic profile and visual concept is mapped
// to a sober vector icon (lucide), through a stable semantic key that is
// decoupled from the underlying library.

export type ProfileIconName =
    | 'shield'
    | 'megaphone'
    | 'landmark'
    | 'leaf'
    | 'columns'
    | 'globe'
    | 'wind'
    | 'rocket'
    | 'castle'
    | 'strategy'
    | 'handshake'
    | 'solidarity'
    | 'tradition'
    | 'balance'
    | 'compass';

const ICONS: Record<ProfileIconName, LucideIcon> = {
    shield: ShieldCheck,
    megaphone: Megaphone,
    landmark: Landmark,
    leaf: Leaf,
    columns: Building2,
    globe: Globe,
    wind: Wind,
    rocket: Rocket,
    castle: Castle,
    strategy: Swords,
    handshake: Handshake,
    solidarity: Users,
    tradition: Church,
    balance: Scale,
    compass: Compass
};

export function resolveProfileIcon(name: ProfileIconName | undefined): LucideIcon {
    return (name && ICONS[name]) || Compass;
}

// Raw SVG data for the same icons (tag + attributes), for contexts that cannot
// render a lucide React component (OG image generation via Satori). Extracted
// from lucide at install time; see iconNodes.json.
import iconNodesRaw from './iconNodes.json';

type IconNode = [string, Record<string, string | number>][];
const ICON_NODES = iconNodesRaw as Record<ProfileIconName, IconNode>;

export function profileIconNode(name: ProfileIconName | undefined): IconNode {
    return (name && ICON_NODES[name]) || ICON_NODES.compass;
}

interface ProfileIconProps {
    name: ProfileIconName | undefined;
    className?: string;
    strokeWidth?: number;
}

export function ProfileIcon({ name, className, strokeWidth = 1.5 }: ProfileIconProps) {
    // createElement (rather than <Icon/>) because the component is resolved
    // dynamically: avoids "creating a component during render".
    return createElement(resolveProfileIcon(name), {
        className,
        strokeWidth,
        'aria-hidden': 'true'
    });
}
