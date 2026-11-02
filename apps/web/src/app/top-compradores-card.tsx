import Link from 'next/link';

const ASSETS = {
  artwork: '/lu/nuevo/top-compradores/3c0f1.png',
  card: '/lu/nuevo/top-compradores/8854a.svg',
  live: '/lu/nuevo/top-compradores/b78d6.svg',
  arrow: '/lu/nuevo/top-compradores/3270f.svg',
} as const;

type Buyer = {
  playerProfileId: string;
  displayName: string | null;
  seasonalDiamonds: number;
  rank: number;
};

function ArtworkCrop({ className, label }: { className: string; label: string }) {
  return (
    <div className={className} role="img" aria-label={label}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="artwork-crop__image" src={ASSETS.artwork} alt="" />
    </div>
  );
}

const SLOT = ['first', 'second', 'third'] as const;

function formatScore(value: number): string {
  return Number(value ?? 0).toLocaleString('en-US');
}

/** Bind each podium slot by rank so name/score always land on medal 1/2/3. */
function podiumBuyers(top3: ReadonlyArray<Buyer>) {
  const byRank = new Map<number, Buyer>();
  for (const player of top3) {
    if (player.rank >= 1 && player.rank <= 3 && !byRank.has(player.rank)) {
      byRank.set(player.rank, player);
    }
  }
  // Fallback to array order when rank is missing/duplicate.
  const ordered = [...top3].sort((a, b) => a.rank - b.rank);
  return ([1, 2, 3] as const).flatMap((rank) => {
    const player = byRank.get(rank) ?? ordered[rank - 1];
    if (!player) return [];
    const slot = SLOT[rank - 1];
    return [
      {
        id: player.playerProfileId,
        rank,
        name: (player.displayName ?? 'Jugador').toUpperCase(),
        total: formatScore(player.seasonalDiamonds),
        className: `buyer buyer--${slot}`,
        medalClass: `artwork-crop artwork-crop--medal artwork-crop--medal-${rank}`,
      },
    ];
  });
}

export function TopCompradoresCard({
  seasonNumber,
  top3,
}: {
  seasonNumber: number;
  top3: ReadonlyArray<Buyer>;
}) {
  const buyers = podiumBuyers(top3);

  return (
    <section
      className="leaderboard ranking rk reveal in"
      aria-labelledby="leaderboard-title"
      aria-label="Top compradores de la temporada"
    >
      <div className="leaderboard__stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="leaderboard__artwork" src={ASSETS.artwork} alt="" />
        <div className="leaderboard__glow" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="leaderboard__card" src={ASSETS.card} alt="" />

        <ArtworkCrop className="artwork-crop artwork-crop--crown" label="Emblema de corona" />

        <div className="leaderboard__heading-divider" aria-hidden="true" />
        <div className="leaderboard__heading">
          <h2 id="leaderboard-title">
            <span className="leaderboard__top">TOP</span>
            <span className="leaderboard__buyers">COMPRADORES</span>
          </h2>
          <div className="leaderboard__season">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ASSETS.live} alt="" />
            <p>TEMPORADA {seasonNumber} - EN CURSO</p>
          </div>
        </div>

        <Link className="ranking-button" href="/ranking">
          <span>VER RANKING COMPLETO</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ASSETS.arrow} alt="" />
        </Link>

        <div className="buyer-divider buyer-divider--first" aria-hidden="true" />
        <div className="buyer-divider buyer-divider--second" aria-hidden="true" />

        <div className="leaderboard__ranking">
          {buyers.map((buyer) => (
            <article
              className={buyer.className}
              key={buyer.id}
              data-rank={buyer.rank}
              data-name={buyer.name}
              data-score={buyer.total}
            >
              <ArtworkCrop className={buyer.medalClass} label={`${buyer.name}`} />
              <div className="buyer__details">
                <h3>{buyer.name}</h3>
                <p>{buyer.total}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
