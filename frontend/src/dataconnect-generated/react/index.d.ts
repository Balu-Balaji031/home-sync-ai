import { CreateUserData, CreateUserVariables, UpdateUserData, UpdateUserVariables, DeleteUserData, GetUserData, ListUsersData, CreateSkillData, CreateSkillVariables, UpdateSkillData, UpdateSkillVariables, DeleteSkillData, DeleteSkillVariables, GetSkillData, GetSkillVariables, ListSkillsData, CreateListingData, CreateListingVariables, UpdateListingData, UpdateListingVariables, DeleteListingData, DeleteListingVariables, GetListingData, GetListingVariables, ListListingsData, CreateBookingData, CreateBookingVariables, UpdateBookingData, UpdateBookingVariables, DeleteBookingData, DeleteBookingVariables, GetBookingData, GetBookingVariables, ListMyBookingsData, CreateReviewData, CreateReviewVariables, UpdateReviewData, UpdateReviewVariables, DeleteReviewData, DeleteReviewVariables, GetReviewData, GetReviewVariables, ListReviewsData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateUser(options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, CreateUserVariables>): UseDataConnectMutationResult<CreateUserData, CreateUserVariables>;
export function useCreateUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, CreateUserVariables>): UseDataConnectMutationResult<CreateUserData, CreateUserVariables>;

export function useUpdateUser(options?: useDataConnectMutationOptions<UpdateUserData, FirebaseError, UpdateUserVariables | void>): UseDataConnectMutationResult<UpdateUserData, UpdateUserVariables>;
export function useUpdateUser(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateUserData, FirebaseError, UpdateUserVariables | void>): UseDataConnectMutationResult<UpdateUserData, UpdateUserVariables>;

export function useDeleteUser(options?: useDataConnectMutationOptions<DeleteUserData, FirebaseError, void>): UseDataConnectMutationResult<DeleteUserData, undefined>;
export function useDeleteUser(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteUserData, FirebaseError, void>): UseDataConnectMutationResult<DeleteUserData, undefined>;

export function useGetUser(options?: useDataConnectQueryOptions<GetUserData>): UseDataConnectQueryResult<GetUserData, undefined>;
export function useGetUser(dc: DataConnect, options?: useDataConnectQueryOptions<GetUserData>): UseDataConnectQueryResult<GetUserData, undefined>;

export function useListUsers(options?: useDataConnectQueryOptions<ListUsersData>): UseDataConnectQueryResult<ListUsersData, undefined>;
export function useListUsers(dc: DataConnect, options?: useDataConnectQueryOptions<ListUsersData>): UseDataConnectQueryResult<ListUsersData, undefined>;

export function useCreateSkill(options?: useDataConnectMutationOptions<CreateSkillData, FirebaseError, CreateSkillVariables>): UseDataConnectMutationResult<CreateSkillData, CreateSkillVariables>;
export function useCreateSkill(dc: DataConnect, options?: useDataConnectMutationOptions<CreateSkillData, FirebaseError, CreateSkillVariables>): UseDataConnectMutationResult<CreateSkillData, CreateSkillVariables>;

export function useUpdateSkill(options?: useDataConnectMutationOptions<UpdateSkillData, FirebaseError, UpdateSkillVariables>): UseDataConnectMutationResult<UpdateSkillData, UpdateSkillVariables>;
export function useUpdateSkill(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateSkillData, FirebaseError, UpdateSkillVariables>): UseDataConnectMutationResult<UpdateSkillData, UpdateSkillVariables>;

export function useDeleteSkill(options?: useDataConnectMutationOptions<DeleteSkillData, FirebaseError, DeleteSkillVariables>): UseDataConnectMutationResult<DeleteSkillData, DeleteSkillVariables>;
export function useDeleteSkill(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteSkillData, FirebaseError, DeleteSkillVariables>): UseDataConnectMutationResult<DeleteSkillData, DeleteSkillVariables>;

export function useGetSkill(vars: GetSkillVariables, options?: useDataConnectQueryOptions<GetSkillData>): UseDataConnectQueryResult<GetSkillData, GetSkillVariables>;
export function useGetSkill(dc: DataConnect, vars: GetSkillVariables, options?: useDataConnectQueryOptions<GetSkillData>): UseDataConnectQueryResult<GetSkillData, GetSkillVariables>;

export function useListSkills(options?: useDataConnectQueryOptions<ListSkillsData>): UseDataConnectQueryResult<ListSkillsData, undefined>;
export function useListSkills(dc: DataConnect, options?: useDataConnectQueryOptions<ListSkillsData>): UseDataConnectQueryResult<ListSkillsData, undefined>;

export function useCreateListing(options?: useDataConnectMutationOptions<CreateListingData, FirebaseError, CreateListingVariables>): UseDataConnectMutationResult<CreateListingData, CreateListingVariables>;
export function useCreateListing(dc: DataConnect, options?: useDataConnectMutationOptions<CreateListingData, FirebaseError, CreateListingVariables>): UseDataConnectMutationResult<CreateListingData, CreateListingVariables>;

export function useUpdateListing(options?: useDataConnectMutationOptions<UpdateListingData, FirebaseError, UpdateListingVariables>): UseDataConnectMutationResult<UpdateListingData, UpdateListingVariables>;
export function useUpdateListing(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateListingData, FirebaseError, UpdateListingVariables>): UseDataConnectMutationResult<UpdateListingData, UpdateListingVariables>;

export function useDeleteListing(options?: useDataConnectMutationOptions<DeleteListingData, FirebaseError, DeleteListingVariables>): UseDataConnectMutationResult<DeleteListingData, DeleteListingVariables>;
export function useDeleteListing(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteListingData, FirebaseError, DeleteListingVariables>): UseDataConnectMutationResult<DeleteListingData, DeleteListingVariables>;

export function useGetListing(vars: GetListingVariables, options?: useDataConnectQueryOptions<GetListingData>): UseDataConnectQueryResult<GetListingData, GetListingVariables>;
export function useGetListing(dc: DataConnect, vars: GetListingVariables, options?: useDataConnectQueryOptions<GetListingData>): UseDataConnectQueryResult<GetListingData, GetListingVariables>;

export function useListListings(options?: useDataConnectQueryOptions<ListListingsData>): UseDataConnectQueryResult<ListListingsData, undefined>;
export function useListListings(dc: DataConnect, options?: useDataConnectQueryOptions<ListListingsData>): UseDataConnectQueryResult<ListListingsData, undefined>;

export function useCreateBooking(options?: useDataConnectMutationOptions<CreateBookingData, FirebaseError, CreateBookingVariables>): UseDataConnectMutationResult<CreateBookingData, CreateBookingVariables>;
export function useCreateBooking(dc: DataConnect, options?: useDataConnectMutationOptions<CreateBookingData, FirebaseError, CreateBookingVariables>): UseDataConnectMutationResult<CreateBookingData, CreateBookingVariables>;

export function useUpdateBooking(options?: useDataConnectMutationOptions<UpdateBookingData, FirebaseError, UpdateBookingVariables>): UseDataConnectMutationResult<UpdateBookingData, UpdateBookingVariables>;
export function useUpdateBooking(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateBookingData, FirebaseError, UpdateBookingVariables>): UseDataConnectMutationResult<UpdateBookingData, UpdateBookingVariables>;

export function useDeleteBooking(options?: useDataConnectMutationOptions<DeleteBookingData, FirebaseError, DeleteBookingVariables>): UseDataConnectMutationResult<DeleteBookingData, DeleteBookingVariables>;
export function useDeleteBooking(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteBookingData, FirebaseError, DeleteBookingVariables>): UseDataConnectMutationResult<DeleteBookingData, DeleteBookingVariables>;

export function useGetBooking(vars: GetBookingVariables, options?: useDataConnectQueryOptions<GetBookingData>): UseDataConnectQueryResult<GetBookingData, GetBookingVariables>;
export function useGetBooking(dc: DataConnect, vars: GetBookingVariables, options?: useDataConnectQueryOptions<GetBookingData>): UseDataConnectQueryResult<GetBookingData, GetBookingVariables>;

export function useListMyBookings(options?: useDataConnectQueryOptions<ListMyBookingsData>): UseDataConnectQueryResult<ListMyBookingsData, undefined>;
export function useListMyBookings(dc: DataConnect, options?: useDataConnectQueryOptions<ListMyBookingsData>): UseDataConnectQueryResult<ListMyBookingsData, undefined>;

export function useCreateReview(options?: useDataConnectMutationOptions<CreateReviewData, FirebaseError, CreateReviewVariables>): UseDataConnectMutationResult<CreateReviewData, CreateReviewVariables>;
export function useCreateReview(dc: DataConnect, options?: useDataConnectMutationOptions<CreateReviewData, FirebaseError, CreateReviewVariables>): UseDataConnectMutationResult<CreateReviewData, CreateReviewVariables>;

export function useUpdateReview(options?: useDataConnectMutationOptions<UpdateReviewData, FirebaseError, UpdateReviewVariables>): UseDataConnectMutationResult<UpdateReviewData, UpdateReviewVariables>;
export function useUpdateReview(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateReviewData, FirebaseError, UpdateReviewVariables>): UseDataConnectMutationResult<UpdateReviewData, UpdateReviewVariables>;

export function useDeleteReview(options?: useDataConnectMutationOptions<DeleteReviewData, FirebaseError, DeleteReviewVariables>): UseDataConnectMutationResult<DeleteReviewData, DeleteReviewVariables>;
export function useDeleteReview(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteReviewData, FirebaseError, DeleteReviewVariables>): UseDataConnectMutationResult<DeleteReviewData, DeleteReviewVariables>;

export function useGetReview(vars: GetReviewVariables, options?: useDataConnectQueryOptions<GetReviewData>): UseDataConnectQueryResult<GetReviewData, GetReviewVariables>;
export function useGetReview(dc: DataConnect, vars: GetReviewVariables, options?: useDataConnectQueryOptions<GetReviewData>): UseDataConnectQueryResult<GetReviewData, GetReviewVariables>;

export function useListReviews(options?: useDataConnectQueryOptions<ListReviewsData>): UseDataConnectQueryResult<ListReviewsData, undefined>;
export function useListReviews(dc: DataConnect, options?: useDataConnectQueryOptions<ListReviewsData>): UseDataConnectQueryResult<ListReviewsData, undefined>;
