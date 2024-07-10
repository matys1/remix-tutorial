/* displays the content of the contactId route (i.e. the "/contacts/some-name" path) */

import type { FunctionComponent } from "react";
import type { ContactRecord } from "../data";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useFetcher } from "@remix-run/react";
import { getContact, updateContact } from "../data";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";

/*
  runs when `fetcher.Form` star button is clicked with `method` POST and default `action` targeting this route.
  it retrieves the submitted form data as `formData` with value either `{ favorite: 'true' }` or `{ favorite: 'false' }`.
  it then returns the promise of the `updateContact` function call passing `contactId` retrieved from `params` and a
  `favorite` option of either `true` (star was selected) or `false` (star was un-selected).

  note that because the `action` returns a promise the `loader` function will not run until that promise has settled.
  if the promise fulfills the `loader` function will run returning the updated `contact` data for the given `contactId`.
  if the promise rejects the `loader` function will run returning the unchanged `contact` data for the given `contactId`.

  whenever this `action` runs the `loader` (after awaiting for the returned prmise to settle) will run afterwards to "re-validate" and the component will re-render.
*/
export const action = async ({ params, request }: ActionFunctionArgs) => {
  invariant(params.contactId, "Missing contactId param");
  const formData = await request.formData();
  return updateContact(params.contactId, {
    favorite: formData.get("favorite") === "true",
  });
};

/*
  runs when rendering / re-validating this route. it gets the given `contactId` from `params`,
  fetches the contact details and returns the `contact` data for that given `contactId`.

  whenever this `loader` runs the `App` component below will also re-render.
*/
export const loader = async ({ params }: LoaderFunctionArgs) => {
  invariant(params.contactId, "Missing contactId param");
  const contact = await getContact(params.contactId);
  if (!contact) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ contact });
};

export default function Contact() {
  // access data returned by `loader`.
  const { contact } = useLoaderData<typeof loader>();

  return (
    <div id="contact">
      <div>
        <img
          alt={`${contact.first} ${contact.last} avatar`}
          key={contact.avatar}
          src={contact.avatar}
        />
      </div>

      <div>
        <h1>
          {contact.first || contact.last ? (
            <>
              {contact.first} {contact.last}
            </>
          ) : (
            <i>No Name</i>
          )}{" "}
          <Favorite contact={contact} />
        </h1>

        {contact.twitter ? (
          <p>
            <a
              href={`https://twitter.com/${contact.twitter}`}
            >
              {contact.twitter}
            </a>
          </p>
        ) : null}

        {contact.notes ? <p>{contact.notes}</p> : null}

        <div>
          {/* 
            this Form button with the default GET `method` and `action` targeting `/contacts/some-name/edit` route
            is the same as a <Link /> navigation since the the GET method will go to the `loader` of the route
            which is the smae as a simple page navigation. 
          */}
          <Form action="edit">
            <button type="submit">Edit</button>
          </Form>

          {/* 
            this Form button with the POST `method` and `action` targeting `/contacts/some-name/destroy` route
            will delete the given contact and end up redirecting the user to "/".
          */}
          <Form
            action="destroy"
            method="post"
            onSubmit={(event) => {
              const response = confirm(
                "Please confirm you want to delete this record."
              );
              if (!response) {
                event.preventDefault();
              }
            }}
          >
            <button type="submit">Delete</button>
          </Form>
        </div>
      </div>
    </div>
  );
}

/*
  when the user clicks on the `fetcher.Form` button with a `method` POST and default `action` targeting this route
  it will send a request to server `action` function and the `Contact` (including `Favorite`) component will re-render
  immediately. during this first re-render the `fetcher.state` is "submitting" and the "optimistic" value that was sub-
  mitted and is stored in `fetcher.formData` is used.
  
  once the `action` function completes and returns the promise (but before the promise has settled) the component will re-render
  for the second time this time the `fetcher.state` is "loading". this "loading" phase includes the `loader` awaiting for the
  promise to settle and then loading the data. the "optimistic" value that was submitted and is stored in `fetcher.formData` is used again.

  once the `loader` function completes and returns the data the component will re-render for the third and final time this time
  the `fetcher.state` is "idle" and the `fetcher.formData` is `undefined` as the navigation lifecycle initiated by the 
  `fetcer.Form` submission has completed and the actual value from the `contact` prop (which was returned by the `loader`) is used
  which is either the now updated value (if the promise fulfilled) or the unchanged value (if the promise rejected).
*/
const Favorite: FunctionComponent<{contact: Pick<ContactRecord, "favorite">}> = ({ contact }) => {
  const fetcher = useFetcher();
  const favorite = fetcher.formData
    ? fetcher.formData.get("favorite") === "true"
    : contact.favorite;

  return (
    <fetcher.Form method="post">
      <button
        aria-label={
          favorite
            ? "Remove from favorites"
            : "Add to favorites"
        }
        name="favorite"
        value={favorite ? "false" : "true"}
      >
        {favorite ? "★" : "☆"}
      </button>
    </fetcher.Form>
  );
};
