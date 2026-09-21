import { Button, Text } from "react-email";
import { Shell, buttonStyle, quiet } from "./shell";

export default function ConfirmDelete({ url, name }: { url: string; name?: string }) {
  return (
    <Shell preview="Confirm deleting the owner account">
      <Text>Hi{name ? ` ${name}` : ""},</Text>
      <Text>This deletes the owner account for Pepper Tree Hair. Services, stylists and bookings stay in the salon, and the next person to sign up becomes the owner. It cannot be undone.</Text>
      <Button href={url} style={buttonStyle}>
        Delete the owner account
      </Button>
      <Text style={{ color: quiet, fontSize: 13 }}>If that wasn&apos;t you, ignore this and nothing changes.</Text>
    </Shell>
  );
}
