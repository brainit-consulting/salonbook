import type { Metadata } from "next";
import Link from "next/link";
import { Blank } from "@/components/legal-blank";
import { legal } from "@/lib/legal";
import { formatDay } from "@/lib/salon/time";

export const metadata: Metadata = { title: "Privacy" };

// Every sentence here describes something the code does. If the app changes,
// change this page and move lastUpdated in src/lib/legal.ts.
export default function PrivacyPage() {
  const updated = `${formatDay(legal.lastUpdated)}, ${legal.lastUpdated.slice(0, 4)}`;

  return (
    <article className="max-w-prose">
      <h1 className="double-rule text-[1.75rem]">Privacy</h1>
      <p className="figures -mt-3 text-xs text-muted-foreground">Last updated {updated}</p>

      <div className="mt-8 space-y-10 leading-relaxed [&_h2]:mb-3 [&_h2]:text-2xl [&_p+p]:mt-3">
        <section>
          <h2>This salon is made up</h2>
          <p>
            {legal.appName} is not a real salon. It was built to teach a workshop, and the
            stylists, prices and bookings you see are sample data. If you try the booking form,
            do not enter real details you would not want stored on a demo.
          </p>
          <p>
            This page is a plain account of what the site does, written from the code. It is not
            legal advice.
          </p>
        </section>

        <section>
          <h2>What a booking stores</h2>
          <p>When you book, the salon keeps:</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>your name, phone number and email address</li>
            <li>the service, the stylist and the time you picked</li>
          </ul>
          <p>
            That is all the form asks for. It is kept in the salon&rsquo;s own database. You do
            not need an account to book, and the site does not make one for you.
          </p>
        </section>

        <section>
          <h2>Who can see it</h2>
          <p>
            The salon owner, in the diary. The owner can also connect an AI assistant to the
            salon. A connected assistant acts as the owner: it can read the diary, including your
            name, phone number and email, and it can make or cancel bookings. The owner
            chooses which assistants to connect and can cut one off in settings at any time.
          </p>
          <p>Nobody else can look at the diary, and your details are not sold.</p>
        </section>

        <section>
          <h2>Email</h2>
          <p>
            When you book or cancel, the site writes you an email and saves a copy where the
            owner can read it. Whether that email is actually sent depends on how the site is set
            up. If it is connected to Resend, a mail delivery company, Resend delivers it, which
            means Resend handles your email address and the message. If it is not connected, the
            email is only saved and nothing is sent.
          </p>
          <p>
            These emails are about your booking: the confirmation, and a note if it is cancelled.
            They are not marketing, and booking does not put you on a mailing list.
          </p>
        </section>

        <section>
          <h2>Cookies</h2>
          <p>
            There is one, and it is for the owner: it keeps the owner signed in. Clients booking
            or cancelling get no cookies at all. Nothing on this site tracks anyone, there are no
            analytics and no adverts, so there is no cookie banner to answer.
          </p>
        </section>

        <section>
          <h2>Removing your details</h2>
          <p>
            Cancelling a booking frees the time, but it does not delete anything. The booking
            stays in the diary marked as cancelled, with your details on it.
          </p>
          <p>
            To have your details removed, write to{" "}
            {legal.contactEmail ? (
              <a
                href={`mailto:${legal.contactEmail}`}
                className="underline underline-offset-4 hover:text-primary"
              >
                {legal.contactEmail}
              </a>
            ) : (
              <Blank field="contactEmail" />
            )}{" "}
            and say which booking is yours.
          </p>
        </section>
      </div>

      <p className="mt-12 border-t pt-6">
        <Link href="/" className="underline underline-offset-4 hover:text-primary">
          Back to the salon
        </Link>
      </p>
    </article>
  );
}
