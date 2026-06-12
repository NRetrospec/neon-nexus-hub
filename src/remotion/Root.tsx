import { Composition } from "remotion";
import { PhreshTeamTrailer } from "./PhreshTeamTrailer";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PhreshTeamTrailer"
        component={PhreshTeamTrailer}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="PhreshTeamTrailer-Vertical"
        component={PhreshTeamTrailer}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ vertical: true }}
      />
    </>
  );
};
