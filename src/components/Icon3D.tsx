/** Detailed 3D icons from Microsoft Fluent Emoji (MIT), stored in public/icons/3d. */
export type Icon3DName =
  | 'bulb' | 'camera' | 'chat' | 'check' | 'clipboard' | 'envelope' | 'fire' | 'fireworks' | 'gear' | 'ghost' | 'gift'
  | 'heart' | 'house' | 'inbox' | 'key' | 'map' | 'medal' | 'money' | 'moon' | 'owl' | 'party' | 'people' | 'person'
  | 'pin' | 'pumpkin' | 'shield' | 'snowman' | 'sparkles' | 'star' | 'tree' | 'trophy'
  | 'bat' | 'bell' | 'candle' | 'candy' | 'crystal' | 'deer' | 'firecracker' | 'ribbon' | 'skull' | 'snowflake' | 'sparkler' | 'spider' | 'web'
  | 'blossom' | 'chick' | 'corn' | 'diya' | 'dove' | 'dragon' | 'egg' | 'envelope-red' | 'flower' | 'lantern' | 'leaf' | 'lotus' | 'menorah'
  | 'pie' | 'rabbit' | 'tulip' | 'turkey';

export function Icon3D({ name, size = 28, label, className }: { name: Icon3DName; size?: number; label?: string; className?: string }) {
  return (
    <img
      src={`/icons/3d/${name}.webp`}
      width={size}
      height={size}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      className={className ? `i3d ${className}` : 'i3d'}
      decoding="async"
    />
  );
}
