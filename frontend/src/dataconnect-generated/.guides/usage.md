# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useCreateUser, useUpdateUser, useDeleteUser, useGetUser, useListUsers, useCreateSkill, useUpdateSkill, useDeleteSkill, useGetSkill, useListSkills } from '@dataconnect/generated/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useCreateUser(createUserVars);

const { data, isPending, isSuccess, isError, error } = useUpdateUser(updateUserVars);

const { data, isPending, isSuccess, isError, error } = useDeleteUser();

const { data, isPending, isSuccess, isError, error } = useGetUser();

const { data, isPending, isSuccess, isError, error } = useListUsers();

const { data, isPending, isSuccess, isError, error } = useCreateSkill(createSkillVars);

const { data, isPending, isSuccess, isError, error } = useUpdateSkill(updateSkillVars);

const { data, isPending, isSuccess, isError, error } = useDeleteSkill(deleteSkillVars);

const { data, isPending, isSuccess, isError, error } = useGetSkill(getSkillVars);

const { data, isPending, isSuccess, isError, error } = useListSkills();

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createUser, updateUser, deleteUser, getUser, listUsers, createSkill, updateSkill, deleteSkill, getSkill, listSkills } from '@dataconnect/generated';


// Operation CreateUser:  For variables, look at type CreateUserVars in ../index.d.ts
const { data } = await CreateUser(dataConnect, createUserVars);

// Operation UpdateUser:  For variables, look at type UpdateUserVars in ../index.d.ts
const { data } = await UpdateUser(dataConnect, updateUserVars);

// Operation DeleteUser: 
const { data } = await DeleteUser(dataConnect);

// Operation GetUser: 
const { data } = await GetUser(dataConnect);

// Operation ListUsers: 
const { data } = await ListUsers(dataConnect);

// Operation CreateSkill:  For variables, look at type CreateSkillVars in ../index.d.ts
const { data } = await CreateSkill(dataConnect, createSkillVars);

// Operation UpdateSkill:  For variables, look at type UpdateSkillVars in ../index.d.ts
const { data } = await UpdateSkill(dataConnect, updateSkillVars);

// Operation DeleteSkill:  For variables, look at type DeleteSkillVars in ../index.d.ts
const { data } = await DeleteSkill(dataConnect, deleteSkillVars);

// Operation GetSkill:  For variables, look at type GetSkillVars in ../index.d.ts
const { data } = await GetSkill(dataConnect, getSkillVars);

// Operation ListSkills: 
const { data } = await ListSkills(dataConnect);


```