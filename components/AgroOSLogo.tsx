import Image from 'next/image'

interface Props {
  size?: number
}

export default function AgroOSLogo({ size = 40 }: Props) {
  return (
    <Image
      src="/icons/logo-mark.svg"
      alt="SmartAgroOS"
      width={size}
      height={size}
      priority
    />
  )
}
