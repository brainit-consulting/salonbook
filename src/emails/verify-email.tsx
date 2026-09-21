import { Button, Text } from "react-email";
import { Shell, buttonStyle, quiet } from "./shell";

export default function VerifyEmail({ url, name }: { url: string; name?: string }) {
  return (
    <Shell preview="Confirm your email address">
      <Text>Hi{name ? ` ${name}` : ""},</Text>
      <Text>Confirm your email address so password resets for the Pepper Tree Hair diary can reach you.</Text>
      <Button href={url} style={buttonStyle}>
        Confirm email
      </Button>
      <Text style={{ color: quiet, fontSize: 13 }}>If you didn&apos;t set up the salon&apos;s owner account, you can ignore this.</Text>
    </Shell>
  );
}
