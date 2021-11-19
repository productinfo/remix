import type { LoaderFunction, LinksFunction } from "remix";
import {
  Form,
  Outlet,
  useCatch,
  useLoaderData,
  Link,
  NavLink,
  json,
} from "remix";
import { db } from "~/utils/db.server";
import type { User } from "@prisma/client";
import { getUser } from "~/utils/session.server";
import stylesUrl from "../styles/jokes-layout.css";

interface LoaderData {
  user: User | null;
  jokeListItems: Array<{ id: string; name: string }>;
}

export let loader: LoaderFunction = async ({ request }) => {
  let jokeListItems = await db.joke.findMany({
    take: 5,
    select: { id: true, name: true },
  });
  let user = await getUser(request);

  let data: LoaderData = {
    jokeListItems,
    user,
  };

  return json(data);
};

export let links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

function Footer() {
  return (
    <footer className="jokes-footer">
      <div className="container">
        <Link reloadDocument to="/jokes-rss">
          RSS
        </Link>
      </div>
    </footer>
  );
}

function Header({ user }: { user: User | null }) {
  return (
    <header className="jokes-header">
      <div className="container">
        <div className="home-link">
          <Link to="/" title="Remix Jokes" aria-label="Remix Jokes">
            <span className="logo">🤪</span>
            <span className="logo-medium">J🤪KES</span>
          </Link>
        </div>
        <nav>
          <ul>
            <li>
              <NavLink to="/jokes">Read Jokes</NavLink>
            </li>
            <li>
              <NavLink to="/about">About</NavLink>
            </li>
            <li>
              {user ? (
                <Link to="/logout">Logout</Link>
              ) : (
                <NavLink to="/login">Login</NavLink>
              )}
            </li>
          </ul>
        </nav>
        {user ? (
          <>
            {`Hi ${user.username}`}
            <Link to="/logout" className="button">
              Logout
            </Link>
          </>
        ) : null}
      </div>
    </header>
  );
}

function Layout({ children }: React.PropsWithChildren<{}>) {
  let data = useLoaderData<LoaderData>();

  return (
    <div className="jokes-layout">
      <Header user={data.user} />
      <main className="jokes-main">
        <div className="container">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

export default function JokesScreen() {
  let data = useLoaderData<LoaderData>();

  return (
    <Layout>
      <Outlet />
      <p>Here are a few more jokes to check out</p>
      <ul>
        {data.jokeListItems.map(({ id, name }) => (
          <li key={id}>
            <Link to={id}>{name}</Link>
          </li>
        ))}
      </ul>
      <Link to="new" className="button">
        Add your own
      </Link>
    </Layout>
  );
}

export function CatchBoundary() {
  let caught = useCatch();

  switch (caught.status) {
    case 401:
    case 404:
      return (
        <Layout>
          <h1>
            {caught.status}: {caught.statusText}
          </h1>
        </Layout>
      );

    default:
      throw new Error(
        `Unexpected caught response with status: ${caught.status}`
      );
  }
}
