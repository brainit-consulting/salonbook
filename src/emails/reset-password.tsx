import { Button, Text } from "react-email";
import { Shell, buttonStyle, quiet } from "./shell";

export default function ResetPassword({ url, name }: { url: string; name?: string }) {
  return (
    <Shell preview="Reset your password">
      <Text>Hi{name ? ` ${name}` : ""},</Text>
      <Text>Someone asked to reset the password for the Pepper Tree Hair owner account. The link works for one hour.</Text>
      <Button href={url} style={buttonStyle}>
        Choose a new password
      </Button>
      <Text style={{ color: quiet, fontSize: 13 }}>If that wasn&apos;t you, ignore this and the password stays as it is.</Text>
    </Shell>
  );
}
