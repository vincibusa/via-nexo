import Image from "next/image";

export const Background = () => {
  return (
    <div className="absolute inset-0 h-full w-full">
      <Image
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBE2MR2KP05PulQIy4zzTqHqShks-IAejZoRTgl7D78PIMrevkdAlHlA1fj6u9Olca0ueZ8o--23-66xDljdgT1DUqKrmrKqxIWF34KzSggDr8XCokW2pR3DvaKyQaiyPfMahtT4BdHKMUdFjjbzJOXc_F-GQDNNK3eT509gsKBsgT-6mQ_2PYVlIJCQ00W20u6tl7kgnOrz-LAA2y0XN7Ay8LGBLJ0BGJh6iPJE12aIkJ5rGAh6cnxaZspH5GS1baM6jc2OG8ewclr"
        alt="Background"
        layout="fill"
        objectFit="cover"
        className="opacity-20"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-900/80 to-neutral-900" />
    </div>
  );
};
