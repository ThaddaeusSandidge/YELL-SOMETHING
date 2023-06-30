import { SignIn, SignInButton, useUser } from "@clerk/nextjs";
import { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import { useState } from "react";
import toast from "react-hot-toast";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();
  const [input, setInput] = useState<string>("");
  const ctx = api.useContext();
  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.posts.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Failed to post! Please try again later.");
      }
    },
  });
  console.log(user);
  if (!user) return null;
  return (
    <div className="flex w-full gap-3">
      <Image
        src={user.profileImageUrl}
        alt="Profile Image"
        className="h-14 w-14 rounded-full"
        width={56}
        height={56}
      />
      <input
        placeholder="YELL SOMETHING!"
        className="grow bg-transparent outline-none"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (input !== "") {
              mutate({ content: input });
            }
          }
        }}
        disabled={isPosting}
      />
      {input !== "" && !isPosting && (
        <button
          className="btn rounded bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-2 font-bold text-white"
          onClick={() => mutate({ content: input })}
          disabled={isPosting}
        >
          POST
        </button>
      )}
      {isPosting && (
        <div className="flex items-center justify-center">
          <LoadingSpinner size={20} />
        </div>
      )}
    </div>
  );
};

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
const PostView = (props: PostWithUser) => {
  const { post, author } = props;
  return (
    <div
      key={post.id}
      className="flex w-full gap-3 rounded-lg border-b border-slate-400 bg-white p-4 shadow-xl"
    >
      <Image
        className="h-14 w-14 rounded-full"
        src={author.profileImageUrl}
        alt={`@${author.firstName.toUpperCase()}'s profile picture`}
        width={56}
        height={56}
      />
      <div className="flex flex-col">
        <div className="flex gap-1 font-bold text-black">
          <span>{`@${author.firstName.toUpperCase()}`}</span>

          <span className="font-thin">{` · ${dayjs(post.createdAt)
            .fromNow()
            .toUpperCase()}`}</span>
        </div>
        <span className="text-black">{post.content}</span>
      </div>
    </div>
  );
};
const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();

  if (postsLoading) return <LoadingPage />;

  if (!data) return <div>SOMETHING WENT WRONG...</div>;
  return (
    <div className="flex max-h-fit flex-col gap-y-8">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const { isLoaded: userLoaded, isSignedIn } = useUser();

  // Start fetching asap
  api.posts.getAll.useQuery();

  // Return empty div if both aren't loaded because user usually loads faster
  if (!userLoaded) return <div />;

  return (
    <main className="flex h-screen justify-center overflow-y-hidden p-1">
      <div className=" h-full w-full md:max-w-2xl">
        <div className="mb-8 overflow-y-auto rounded-lg  border-b border-slate-400 bg-white p-4 shadow-xl">
          <h2 className="text-4xl font-extrabold ">YELL SOMETHING!</h2>
          <p className="my-4 text-lg text-gray-500">
            This is my first project using the T3 stack. It is built with
            NextJS, TypeScript, Prisma, Zod, tRPC, NextAuth.js and Tailwind.
            While it is very rudimentary, it has exposed me to lots of fun new
            technology!
          </p>
          <p className="mb-4 text-lg font-normal text-gray-500 dark:text-gray-400">
            Try it out below and yell something - it is great for letting out
            some steam! I really appreciate you checking this out.
          </p>
          {!isSignedIn && (
            <div className="flex-justify-center button bg-indigo-600">
              <SignInButton />
            </div>
          )}
          {!!isSignedIn && <CreatePostWizard />}
        </div>

        <div
          className=" scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 45vh)" }}
        >
          <Feed />
        </div>
      </div>
    </main>
  );
};

export default Home;
