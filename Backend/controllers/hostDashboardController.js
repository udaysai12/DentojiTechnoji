// controllers/hostDashboardController.js
import Admin from "../models/Admin.js";
import Hospital from "../models/Hospital.js";
import Subscription from "../models/Subscription.js";
import mongoose from "mongoose";
import Patient from "../models/Patient.js";
/**
 * Get all doctors/clinics dashboard data
 * Aggregates data from Admin, Hospital, and Subscription collections
 */
export const getDashboardData = async (req, res) => {
  try {
    ///const { page = 1, limit = 50, search = '', sortBy = 'startDate', sortOrder = 'desc' } = req.query;
    const { 
  page = 1, 
  limit = 50, 
  search = '', 
  sortBy = 'startDate', 
  sortOrder = 'desc' 
} = req.query;

// Sanitize and validate parameters
const validatedSortBy = sortBy && sortBy.trim() ? sortBy.trim() : 'startDate';
const validatedSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
const validatedSearch = search ? search.trim() : '';
const validatedPage = Math.max(1, parseInt(page) || 1);
const validatedLimit = Math.max(1, Math.min(100, parseInt(limit) || 50));

console.log('📊 Fetching host dashboard data...', {
  page: validatedPage,
  limit: validatedLimit,
  search: validatedSearch,
  sortBy: validatedSortBy,
  sortOrder: validatedSortOrder
});

    console.log('📊 Fetching host dashboard data...');

    // Build aggregation pipeline
    const pipeline = [
      // Stage 1: Match all admins (you can add filters here if needed)
      {
        $match: {}
      },
      
      // Stage 2: Lookup hospital data
      {
        $lookup: {
          from: 'hospitals',
          localField: '_id',
          foreignField: 'adminId',
          as: 'hospitalData'
        }
      },
      
      // Stage 3: Unwind hospital data (keep admins without hospitals)
      {
        $unwind: {
          path: '$hospitalData',
          preserveNullAndEmptyArrays: true
        }
      },
      
      // Stage 4: Lookup subscription data
      {
        $lookup: {
          from: 'subscriptions',
          let: { adminId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$adminId', '$$adminId'] }
              }
            },
            // Sort by startDate to get the most recent subscription
            { $sort: { startDate: -1 } },
            // Get only the most recent one
            { $limit: 1 }
          ],
          as: 'subscriptionData'
        }
      },
      
      // Stage 5: Unwind subscription data (keep admins without subscriptions)
      {
        $unwind: {
          path: '$subscriptionData',
          preserveNullAndEmptyArrays: true
        }
      },
      
      // Stage 6: Project the final structure
      {
        $project: {
          id: { $toString: '$_id' },
          doctorName: '$name',
          email: '$email',
          clinicName: { 
            $ifNull: ['$hospitalData.name', 'N/A'] 
          },
          // Calculate status based on subscription dates
          status: {
            $cond: {
              if: { $eq: ['$subscriptionData', null] },
              then: 'Inactive',
              else: {
                $cond: {
                  if: {
                    $and: [
                      { $lte: ['$subscriptionData.startDate', new Date()] },
                      { $gte: ['$subscriptionData.endDate', new Date()] }
                    ]
                  },
                  then: 'Active',
                  else: 'Inactive'
                }
              }
            }
          },
          startDate: {
            $ifNull: ['$subscriptionData.startDate', null]
          },
          endDate: {
            $ifNull: ['$subscriptionData.endDate', null]
          },
          planType: {
            $ifNull: ['$subscriptionData.planType', 'None']
          },
          // Additional fields for potential future use
          hospitalId: { $ifNull: ['$hospitalData._id', null] },
          subscriptionId: { $ifNull: ['$subscriptionData._id', null] },
          createdAt: '$createdAt'
        }
      }
    ];

    // Add search filter if provided
if (validatedSearch) {
  pipeline.push({
    $match: {
      $or: [
        { doctorName: { $regex: validatedSearch, $options: 'i' } },
        { email: { $regex: validatedSearch, $options: 'i' } },
        { clinicName: { $regex: validatedSearch, $options: 'i' } },
        { id: { $regex: validatedSearch, $options: 'i' } }
      ]
    }
  });
}



    // Add search filter if provided
    if (search && search.trim()) {
      pipeline.push({
        $match: {
          $or: [
            { doctorName: { $regex: search.trim(), $options: 'i' } },
            { email: { $regex: search.trim(), $options: 'i' } },
            { clinicName: { $regex: search.trim(), $options: 'i' } },
            { id: { $regex: search.trim(), $options: 'i' } }
          ]
        }
      });
    }

   // Add sorting with proper field validation
const getSortField = (sortBy) => {
  const sortFieldMap = {
    'startDate': 'startDate',
    'doctorName': 'doctorName',
    'clinicName': 'clinicName',
    'status': 'status',
    'email': 'email'
  };
  
  // Return mapped field or default to 'startDate' if invalid/empty
  return sortFieldMap[sortBy] || 'startDate';
};

const sortField = getSortField(sortBy);
const sortDirection = sortOrder === 'desc' ? -1 : 1;
pipeline.push({
  $sort: { [sortField]: sortDirection, _id: 1 }
});

    // Execute aggregation to get total count
    const totalCountPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Admin.aggregate(totalCountPipeline);
    const totalRecords = countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination
    // const skip = (parseInt(page) - 1) * parseInt(limit);
    // pipeline.push({ $skip: skip });
    // pipeline.push({ $limit: parseInt(limit) });
    // Add pagination
const skip = (validatedPage - 1) * validatedLimit;
pipeline.push({ $skip: skip });
pipeline.push({ $limit: validatedLimit });

    // Execute the main aggregation
    const results = await Admin.aggregate(pipeline);

    // Format the results with proper date formatting and add sequence numbers
    const formattedResults = results.map((record, index) => {
      // Format startDate as 'MMM DD, YYYY'
      let lastAccessFormatted = 'N/A';
      if (record.startDate) {
        const date = new Date(record.startDate);
        const options = { year: 'numeric', month: 'short', day: '2-digit' };
        lastAccessFormatted = date.toLocaleDateString('en-US', options).replace(',', '');
      }

      return {
        id: record.id,
        sno: skip + index + 1, // Auto-generated sequence number
        doctorName: record.doctorName,
        clinicName: record.clinicName,
        email: record.email,
        status: record.status,
        lastAccess: lastAccessFormatted, // Using startDate formatted
        // Additional fields (not shown in frontend but useful for API)
        planType: record.planType,
        startDate: record.startDate,
        endDate: record.endDate,
        hospitalId: record.hospitalId,
        subscriptionId: record.subscriptionId
      };
    });

    const totalPages = Math.ceil(totalRecords / parseInt(limit));

    console.log(`✅ Fetched ${formattedResults.length} records out of ${totalRecords} total`);

    res.status(200).json({
      success: true,
      data: formattedResults,
    //   pagination: {
    //     currentPage: parseInt(page),
    //     totalPages: totalPages,
    //     totalRecords: totalRecords,
    //     limit: parseInt(limit),
    //     hasNext: page < totalPages,
    //     hasPrev: page > 1
    //   }
    });

  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

/**
 * Get dashboard statistics
 * Returns summary statistics for the host dashboard
 */

/**
 * Get dashboard header statistics
 * Returns comprehensive statistics for the dashboard header cards
 */
export const getDashboardHeaderStats = async (req, res) => {
  try {
    console.log('📈 Fetching dashboard header statistics...');

    // Get total clinics (unique admins with most recent subscription only)
    const totalClinicsResult = await Admin.aggregate([
      {
        $lookup: {
          from: 'subscriptions',
          let: { adminId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$adminId', '$$adminId'] }
              }
            },
            { $sort: { startDate: -1 } },
            { $limit: 1 }
          ],
          as: 'latestSubscription'
        }
      },
      {
        $group: {
          _id: null,
          totalClinics: { $sum: 1 }
        }
      }
    ]);

    // Get active subscriptions (current active non-expired subscriptions)
    const activeSubscriptionsResult = await Subscription.aggregate([
      {
        $match: {
          status: 'active',
          endDate: { $gt: new Date() }
        }
      },
      {
        $group: {
          _id: null,
          activeCount: { $sum: 1 }
        }
      }
    ]);

    // Get trial clinics (active free trial subscriptions only)
    const trialClinicsResult = await Subscription.aggregate([
      {
        $match: {
          planType: 'Free Trial',
          status: 'active',
          endDate: { $gt: new Date() }
        }
      },
      {
        $group: {
          _id: null,
          trialCount: { $sum: 1 }
        }
      }
    ]);

    // Calculate total revenue (Monthly: ₹2,714, Yearly: ₹18,000)
    const revenueResult = await Subscription.aggregate([
      {
        $match: {
          planType: { $in: ['Monthly Plan', 'Yearly Plan'] },
          status: { $in: ['active', 'expired', 'cancelled'] } // Include all paid subscriptions
        }
      },
      {
        $group: {
          _id: '$planType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate revenue based on actual plan prices
    let totalRevenue = 0;
    revenueResult.forEach(plan => {
      if (plan._id === 'Monthly Plan') {
        totalRevenue += plan.count * 1700; // ₹2,714 per monthly subscription
      } else if (plan._id === 'Yearly Plan') {
        totalRevenue += plan.count * 18000; // ₹18,000 per yearly subscription
      }
    });

    const result = {
      totalClinics: totalClinicsResult[0]?.totalClinics || 0,
      activeSubscriptions: activeSubscriptionsResult[0]?.activeCount || 0,
      trialClinics: trialClinicsResult[0]?.trialCount || 0,
      totalRevenue: totalRevenue.toLocaleString('en-IN') // Format as Indian number system
    };

    console.log('✅ Dashboard header statistics fetched:', result);

    res.status(200).json({
      success: true,
      stats: result
    });

  } catch (error) {
    console.error('❌ Error fetching dashboard header stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard header statistics',
      error: error.message
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    console.log('📈 Fetching dashboard statistics...');

    const stats = await Admin.aggregate([
      {
        $lookup: {
          from: 'subscriptions',
          let: { adminId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$adminId', '$$adminId'] }
              }
            },
            { $sort: { startDate: -1 } },
            { $limit: 1 }
          ],
          as: 'latestSubscription'
        }
      },
      {
        $unwind: {
          path: '$latestSubscription',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: null,
          totalDoctors: { $sum: 1 },
          activeDoctors: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$latestSubscription', null] },
                    { $lte: ['$latestSubscription.startDate', new Date()] },
                    { $gte: ['$latestSubscription.endDate', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          },
          inactiveDoctors: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$latestSubscription', null] },
                    { $lt: ['$latestSubscription.endDate', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Get plan type breakdown
    const planBreakdown = await Subscription.aggregate([
      {
        $match: {
          status: 'active',
          endDate: { $gte: new Date() }
        }
      },
      {
        $group: {
          _id: '$planType',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      totalDoctors: stats[0]?.totalDoctors || 0,
      activeDoctors: stats[0]?.activeDoctors || 0,
      inactiveDoctors: stats[0]?.inactiveDoctors || 0,
      planBreakdown: planBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };

    console.log('✅ Dashboard statistics fetched:', result);

    res.status(200).json({
      success: true,
      stats: result
    });

  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

/**
 * Get detailed information for a specific doctor
 */
export const getDoctorDetails = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid doctor ID is required'
      });
    }

    console.log(`🔍 Fetching details for doctor: ${doctorId}`);

    const details = await Admin.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(doctorId) }
      },
      {
        $lookup: {
          from: 'hospitals',
          localField: '_id',
          foreignField: 'adminId',
          as: 'hospital'
        }
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'adminId',
          as: 'subscriptions'
        }
      },
      {
        $unwind: {
          path: '$hospital',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          id: { $toString: '$_id' },
          doctorName: '$name',
          email: '$email',
          phone: '$phone',
          qualification: '$qualification',
          clinicName: { $ifNull: ['$hospital.name', 'N/A'] },
          clinicLocation: { $ifNull: ['$hospital.location', 'N/A'] },
          subscriptions: {
            $map: {
              input: '$subscriptions',
              as: 'sub',
              in: {
                planType: '$$sub.planType',
                status: '$$sub.status',
                startDate: '$$sub.startDate',
                endDate: '$$sub.endDate',
                amount: '$$sub.amount'
              }
            }
          },
          createdAt: '$createdAt'
        }
      }
    ]);

    if (!details || details.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Fetch patient count for this admin
    const patientCount = await Patient.countDocuments({ 
      adminId: new mongoose.Types.ObjectId(doctorId),
      status: { $ne: 'deleted' }
    });

    console.log(`✅ Doctor details fetched successfully with ${patientCount} patients`);

    res.status(200).json({
      success: true,
      data: {
        ...details[0],
        patientCount: patientCount
      }
    });

  } catch (error) {
    console.error('❌ Error fetching doctor details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor details',
      error: error.message
    });
  }
};
/**
 * Delete a doctor and all associated data
 * WARNING: This is a destructive operation
 */
export const deleteDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid doctor ID is required'
      });
    }

    console.log(`🗑️ Deleting doctor: ${doctorId}`);

    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Delete admin
        const admin = await Admin.findByIdAndDelete(doctorId, { session });
        
        if (!admin) {
          throw new Error('Doctor not found');
        }

        // Delete associated hospital
        await Hospital.deleteMany({ adminId: doctorId }, { session });

        // Delete associated subscriptions
        await Subscription.deleteMany({ adminId: doctorId }, { session });

        console.log(`✅ Doctor ${doctorId} and all associated data deleted`);
      });
    } finally {
      await session.endSession();
    }

    res.status(200).json({
      success: true,
      message: 'Doctor and all associated data deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete doctor',
      error: error.message
    });
  }
};

