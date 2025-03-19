import { gql } from 'apollo-server-express';

export default /* GraphQL */ gql`
	type DeleteResult {
		deletedCount: Int!
	}

	type PageInfo {
        endCursor: String
        hasNextPage: Boolean!
    }

	input PaginationInput {
		page: Int = 1
		limit: Int = 10
	}
	
`;