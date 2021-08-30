const { User, Book } = require("../models");
const { AuthenticationError } = require("apollo-server-express")
const { signToken } = require("../utils/auth")

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            console.log(context);
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id})
                .select("-__v -password")
                .populate("books");

                return userData;
            }
            throw new AuthenticationError("Not logged in");
        }
    },

    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
            console.log("called the login mutation");

            if (!user) {
                throw new AuthenticationError("Incorrect credentials");
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError("Incorrect credentials");
            }

            const token = signToken(user);

            return { token, user };
        },
        addUser: async (parent, args) => {
            const user = await User.create(args);

            const token = signToken(user);

            return {token, user};
            console.log("called the addUser mutation");
        },
        saveBook: async (parent, args, context) => {
            console.log(args);
            if (context.user) {
                const updatedUser = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: args.input}},
                    { new: true, runValidators: true }
                );

                return updatedUser;
            }
            console.log("called the saveBook mutation");

            throw new AuthenticationError("You need to be logged in!");
        },
        removeBook: async (parent, {bookId}, context) => {
            console.log("Called the removeBook mutation");
            if (context.user) {
                const updatedUser = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: {bookId} } },
                    { new: true}
                );

                return updatedUser;
            }

            throw new AuthenticationError("You need to be logged in!");
        }
    }
}

module.exports = resolvers;