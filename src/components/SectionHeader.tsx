type Props = { num: string; title: string; hint: string };

export default function SectionHeader({ num, title, hint }: Props) {
  return (
    <div className="section-head">
      <span className="num">{num}</span>
      <span className="title">{title}</span>
      <span className="rule" />
      <span>{hint}</span>
    </div>
  );
}
