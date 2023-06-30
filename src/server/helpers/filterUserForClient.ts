import type { User } from "@clerk/nextjs/server";

export const filterUserForClient = (user: User) => {
    return { id: user.id, firstName: user.firstName, profileImageUrl: user.profileImageUrl }
}