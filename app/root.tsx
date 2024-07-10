import { json, redirect  } from "@remix-run/node";
import {
  Form,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  Outlet,
  NavLink,
  useLoaderData,
  useNavigation,
  useSubmit
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { getContacts, createEmptyContact } from "./data";
import { useEffect } from "react";

/*
  links css stylesheet which will be renderd in the `<Links />` component in `<head>`.
*/
import appStylesHref from "./app.css?url";
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStylesHref },
];

/* 
  runs when you click on the "New" Form button with POST `method` and default `action` targeting this route.
  this `action` simply creates a new empty contact and redirects to the edit path `/contacts/new-contact/edit` 
  of this newly created contact.

  whenever this `action` runs the `loader` will run afterwards to "re-validate" and the component will re-render.
*/ 
export const action = async () => {
  const contact = await createEmptyContact();
  return redirect(`/contacts/${contact.id}/edit`);
};

/* 
  runs when rendering / re-validating this route AND when you search using the Form input.
  when you rendered / re-validate this route `q` is `null` and `contacts` returns all contacts.
  when you perform a search `q` is the value entered in the input and `contacts` is a subset of
  contacts that match the search value of `q`. the search functionality if triggered by a Form
  with default GET `method` and default `action` targeting this route.

  whenever this `loader` runs the `App` component below will also re-render.
*/
export const loader = async ({request}: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const contacts = await getContacts(q);
  return json({ contacts, q });
};

/*
  TODO: explanation why App components renders 3 times (twice with navigation.state "loading")
  instead of rendering 2 times once when "loading" and once when "idle" (after loder returns).
  since search is a GET request the lifecycle is shorter than making a POST request.
*/
export default function App() {
  // access data returned by `loader`.
  const { contacts, q } = useLoaderData<typeof loader>();

  // a hook provding information about pending page navigation for adding pending ui (adds fade to child routes and used when searching).
  const navigation = useNavigation();
  // `searching` is only `true` when navigation is taking place (`navigation.location` is not `undefined`) and `q` search query param is present. 
  const searching = navigation.location && new URLSearchParams(navigation.location.search).has("q");

  // allows to submit a form programmatically on-demand instead of relying on user to perform an explicit action.
  // used to submit the search input Form on each entered keystroke. 
  const submit = useSubmit();

  // whenever the component re-renders and the `q` has changed it will re-sync the the Form search input to display the value of `q`.
  // this is used to resolve the UX issue when a back button is clicked and the query param is no longer there but the input still displays the value.
  useEffect(() => {
    const searchField = document.getElementById("q");
    if (searchField instanceof HTMLInputElement) {
      searchField.value = q || "";
    }
  }, [q]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div id="sidebar">
          <h1>Remix Contacts</h1>
          <div>
            {/* 
              this Form input with the default GET `method` and the default `action` targeting this route
              will submit a GET request to the `loader` function on each key stroke in the input field.
            */}
            <Form id="search-form" role="search" onChange={(event) => {
              const isFirstSearch = q === null;
              submit(event.currentTarget, {
                replace: !isFirstSearch,
              });
            }}>
              <input
                id="q"
                defaultValue={q || ""}
                aria-label="Search contacts"
                className={searching ? "loading" : ""}
                placeholder="Search"
                type="search"
                name="q"
              />
              <div id="search-spinner" aria-hidden hidden={!searching} />
            </Form>
            {/* 
              this Form button "New" with the POST `method` and the default `action` targeting this route
              will submit a POST request to the `action` function when clicked.
            */}
            <Form method="post">
              <button type="submit">New</button>
            </Form>
          </div>
          <nav>
            {contacts.length ? (
                <ul>
                  {contacts.map((contact) => (
                    <li key={contact.id}>
                      <NavLink
                        className={({ isActive, isPending }) =>
                          isActive
                            ? "active"
                            : isPending
                            ? "pending"
                            : ""
                        }
                        to={`contacts/${contact.id}`}
                      >
                        {contact.first || contact.last ? (
                          <>
                            {contact.first} {contact.last}
                          </>
                        ) : (
                          <i>No Name</i>
                        )}{" "}
                        {contact.favorite ? (
                          <span>★</span>
                        ) : null}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>
                  <i>No contacts</i>
                </p>
            )}
          </nav>
        </div>
          {/* the `loading` class is applied for the fade effect only when "loading" and when search is not being performed */}
          <div id="detail" className={navigation.state === "loading" && !searching ? "loading" : ""}>
            <Outlet />
          </div>
          <ScrollRestoration />
          <Scripts />
      </body>
    </html>
  );
}
