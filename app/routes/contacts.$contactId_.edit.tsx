import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData, useNavigate } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getContact, updateContact  } from "../data";

/*
  this `loader` is functionally the same as the `loader` in `/contacts/some-name` route.

  runs when rendering / re-validating this route. it gets the given `contactId` from `params`,
  fetches the contact details and returns the `contact` data for that given `contactId`.

  whenever this `loader` runs the `App` component below will also re-render.
*/
export const loader = async ({params}: LoaderFunctionArgs) => {
  invariant(params.contactId, "Missing contactId param");
  const contact = await getContact(params.contactId);
  if (!contact) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ contact });
};

/*
  runs when you click on the "Save" Form button with POST `method` and default `action` targeting
  this route. it simply retrieves the form data as `formData` and calls `updateContact` to update
  the contact and redirects back to the "/contacts/some-name" route.
*/
export const action = async ({ params, request }: ActionFunctionArgs) => {
  invariant(params.contactId, "Missing contactId param");
  // get the form data; this is all the same regardless if CSR or SSR (e.g. JS enabled) form submission is performed
  const formData = await request.formData();
  // // extract first and last name values from the submitted form data fields
  // const firstName = formData.get("first");
  // const lastName = formData.get("last");
  // or alternatively instead of extracting formData field-by-field you can use `Object.fromEntries` to collect them all into a single object
  const updates = Object.fromEntries(formData);
  // use the form data to update the contact
  await updateContact(params.contactId, updates);
  // redirect back to the contact page
  return redirect(`/contacts/${params.contactId}`);
};

export default function EditContact() {
   // access data returned by `loader`.
  const { contact } = useLoaderData<typeof loader>();

  // a hook that lets you perform browser navigation programmatically on-demand (used 
  // by the "Cancel" button to navigate back to the "/contacts/some-name" route).
  const navigate = useNavigate();

  return (
    /*
      this Form button with the POST `method` and default `action` targeting this route once the "Save"
      button is clicked will send the request to the `action` function above.
    */
    <Form key={contact.id} id="contact-form" method="post">
      <p>
        <span>Name</span>
        <input
          defaultValue={contact.first}
          aria-label="First name"
          name="first"
          type="text"
          placeholder="First"
        />
        <input
          aria-label="Last name"
          defaultValue={contact.last}
          name="last"
          placeholder="Last"
          type="text"
        />
      </p>
      <label>
        <span>Twitter</span>
        <input
          defaultValue={contact.twitter}
          name="twitter"
          placeholder="@jack"
          type="text"
        />
      </label>
      <label>
        <span>Avatar URL</span>
        <input
          aria-label="Avatar URL"
          defaultValue={contact.avatar}
          name="avatar"
          placeholder="https://example.com/avatar.jpg"
          type="text"
        />
      </label>
      <label>
        <span>Notes</span>
        <textarea
          defaultValue={contact.notes}
          name="notes"
          rows={6}
        />
      </label>
      <p>
        <button type="submit">Save</button>
        <button onClick={() => navigate(-1)} type="button">Cancel</button>
      </p>
    </Form>
  );
}
