export default function BallSvg(props: { className?: string }) {
  return (
    <svg
      width="29"
      height="29"
      viewBox="0 0 29 29"
      xmlns="http://www.w3.org/2000/svg"
      className={`h-6 w-auto ${props.className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Football"
    >
      <path d="M14.5 25.375C20.5061 25.375 25.375 20.5061 25.375 14.5C25.375 8.4939 20.5061 3.625 14.5 3.625C8.4939 3.625 3.625 8.4939 3.625 14.5C3.625 20.5061 8.4939 25.375 14.5 25.375Z" />
      <path d="M14.5 9.74219L9.9801 13.0273L11.702 18.3516H17.2981L19.0199 13.0273L14.5 9.74219Z" />
      <path d="M14.5 7.25V9.74219" />
      <path d="M18.4648 4.37256L14.5 7.2499L10.5352 4.37256" />
      <path d="M7.6012 12.2571L9.9801 13.0274" />
      <path d="M6.09456 7.60107L7.6012 12.2569L3.63635 15.1456" />
      <path d="M10.2406 20.368L11.7019 18.3516" />
      <path d="M5.33557 20.3679H10.2407L11.7586 25.0238" />
      <path d="M18.7594 20.368L17.2981 18.3516" />
      <path d="M17.2415 25.0238L18.7594 20.3679H23.6645" />
      <path d="M21.3988 12.2571L19.0199 13.0274" />
      <path d="M25.3636 15.1456L21.3988 12.2569L22.9054 7.60107" />
    </svg>
  )
}
