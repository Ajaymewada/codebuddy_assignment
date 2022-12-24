const User = require("../schema/user.schema");

module.exports.getUsersWithPostCount = async (req, res) => {
  let {
    page,
    limit
  } = req.query;
  if (page && limit) {
    page = parseInt(page);
    limit = parseInt(limit);
  } else {
    page = 1;
    limit = 10;
  }
  try {
    //TODO: Implement this API
    let lookUpQuery = {
      $lookup: {
        from: "posts",
        let: {
          userId: "$_id"
        },
        pipeline: [{
          $match: {
            $expr: {
              $eq: ["$userId", "$$userId"]
            }
          }
        }],
        as: "post_count"
      }
    }
    let projectionQuery = {
      $project: {
        name: 1,
        posts: 1
      }
    }
    let addFieldQuery = {
      $addFields: {
        "posts": {
          $size: "$post_count"
        }
      }
    }
    let skipQuery = {
      $skip: (page - 1) * limit
    }
    let limitQuery = {
      $limit: limit
    }
    // Preparing the suitable pipeline to get the required data
    let pipeline = [lookUpQuery, addFieldQuery, projectionQuery, skipQuery, limitQuery]
    // Finding the Users Documents from database
    let result = await User.aggregate(pipeline);
    // Count the total number of documents
    let totalDocs = await User.countDocuments({});
    // Calculate the total number of pages
    let totalPages = Math.ceil(totalDocs / limit);

    let hasPrevPage = false;
    if (page > 1) {
      hasPrevPage = true
    }
    let hasNextPage = true;
    if (page == totalPages || page > totalPages) {
      hasNextPage = false
    }

    // Preparing the final output
    let finalOutput = {
      "data": {
        "users": result,
        "pagination": {
          "totalDocs": totalDocs,
          "limit": limit,
          "page": page,
          "totalPages": totalPages,
          "pagingCounter": ((page - 1) * limit) + 1,
          "hasPrevPage": hasPrevPage,
          "hasNextPage": hasNextPage,
          "prevPage": page == 1 ? null : page - 1,
          "nextPage": hasNextPage ? page + 1 : null
        }
      }
    }
    // Sending the final response
    res.status(200).json(finalOutput);
  } catch (error) {
    res.send({
      error: error.message
    });
  }
};