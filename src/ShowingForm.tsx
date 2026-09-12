import { type FormEvent } from "react";

type Props = {
  cta: string;
  sent: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export default function ShowingForm({ cta, sent, onSubmit }: Props) {
  if (sent) {
    return <p className="thanks">Request received. We will be in touch.</p>;
  }
  return (
    <form className="showing" name="showing" method="POST" data-netlify="true" onSubmit={onSubmit}>
      <input type="hidden" name="form-name" value="showing" />
      <p className="hp">
        <label>
          Don’t fill this out
          <input name="bot-field" />
        </label>
      </p>
      <label>
        Name
        <input name="name" type="text" required autoComplete="name" />
      </label>
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Phone
        <input name="phone" type="tel" autoComplete="tel" />
      </label>
      <label>
        Preferred date or question
        <textarea name="message" rows={3} />
      </label>
      <button type="submit">{cta}</button>
    </form>
  );
}
