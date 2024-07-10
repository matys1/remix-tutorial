import type { ActionFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { redirect } from "@remix-run/node";
import { deleteContact } from "~/data";

/*
  this action function is called from the parent contacts/some-name route
  and simply deletes the given contact and redirects back to "/".
*/ 
export const action = async ({ params }: ActionFunctionArgs) => {
  invariant(params.contactId, "Missing contactId param");
  await deleteContact(params.contactId);
  return redirect("/");
};
