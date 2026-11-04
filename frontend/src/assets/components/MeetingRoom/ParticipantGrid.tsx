
import "./ParticipantGrid.css";

interface Props {
  names: string[];
}

export default function ParticipantGrid({ names }: Props) {
  return (
    <div className="mr-participants">
      <h3>Participants ({names.length})</h3>

      {names.map((name, index) => (
        <div className="mr-person" key={`${name}-${index}`}>
          <div className="mr-avatar">
            {name.charAt(0).toUpperCase()}
          </div>
          <span>{name}</span>
        </div>
      ))}
    </div>
  );
}
