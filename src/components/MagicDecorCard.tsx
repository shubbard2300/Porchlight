import Link from 'next/link';
import { Icon3D } from '@/components/Icon3D';
import { decorFor } from '@/lib/arDecor';
import { MAGIC } from '@/lib/magic';

/**
 * The host's way in to magic decorations (virtual props visitors see through their phone camera).
 * A big card with a few of this holiday's props floating in it, so it reads as something fun to try
 * rather than a settings link. Shown on the host's profile and on their own house page.
 */
export function MagicDecorCard({ houseId, holiday, count, greeting, id }: { houseId: string; holiday: string | undefined; count: number; greeting: boolean; id?: string }) {
  const props = decorFor(holiday).slice(0, 4);
  const has = count > 0 || greeting;
  const names = decorFor(holiday).slice(0, 2).map((d) => d.name.toLowerCase()).join(' or a ');
  return (
    <div className="magic-card" id={id}>
      <Link href={`/house/${houseId}/ar/edit`} className="magic-card-stage" aria-label={has ? `Edit your ${MAGIC.lower}` : `Add ${MAGIC.lower}`}>
        {props.map((d, i) => <span key={d.key} className={`magic-prop magic-prop-${i}`}><Icon3D name={d.icon} size={i === 0 ? 46 : 32} /></span>)}
        <span className="magic-spark" aria-hidden="true" />
      </Link>
      <div className="stack" style={{ gap: 6 }}>
        <span className="row" style={{ gap: 8 }}>
          <b className="magic-card-title">{MAGIC.title}</b>
          {!has && <span className="pill magic-new">New</span>}
        </span>
        <span className="small muted">
          {count > 0
            ? `${count} ${count === 1 ? 'decoration floats' : 'decorations float'} on your house. Visitors out front see ${count === 1 ? 'it' : 'them'} through their phone camera and can snap a photo with ${count === 1 ? 'it' : 'them'}.`
            : greeting
              ? 'Your greeting floats over the house. Add a few props too, so visitors have something to snap a photo with.'
              : `Add a ${names} that visitors see floating on your house when they point their phone camera at it. No real props needed, and it takes about two minutes.`}
        </span>
        <div className="row" style={{ marginTop: 4, gap: 8 }}>
          <Link href={`/house/${houseId}/ar/edit`} className="btn sm primary">{has ? 'Edit decorations' : `Add ${MAGIC.lower}`}</Link>
          {has && <Link href={`/house/${houseId}/ar`} className="btn sm ghost" title="See what visitors see">Preview</Link>}
        </div>
      </div>
    </div>
  );
}
