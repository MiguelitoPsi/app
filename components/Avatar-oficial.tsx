import Image from "next/image";

type Mood = "happy" | "calm" | "neutral" | "sad" | "anxious" | "angry";
type AvatarOficialProps = {
  mood?: Mood; // ex: "happy", "sad", etc.
};

export default function AvatarOficial({ mood }: AvatarOficialProps) {
  const moodToHueRotate: Record<Mood, number> = {
    happy: 45,
    calm: 90,
    neutral: 0,
    sad: 180,
    anxious: 270,
    angry: 330,
  };
  const hueRotate = mood ? moodToHueRotate[mood] : 0;

  return (
    <div className="relative size-20">
      <Image
        alt="Avatar Oficial"
        className="rounded-full absolute"
        height={64}
        src="/fundo-mascote-feliz.png"
        style={{ filter: `hue-rotate(${hueRotate}deg)` }}
        width={64}
      />
      <Image
        alt="Avatar Oficial"
        className="rounded-full absolute top-0 left-0"
        height={64}
        src="/olhos-boca-nariz.png"
        width={64}
      />
    </div>
  );
}
