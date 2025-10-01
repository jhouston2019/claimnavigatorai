exports.handler = async (event) => {
  try {
    // Parse request body
    let requestData = {};
    try {
      if (event.body) {
        requestData = JSON.parse(event.body);
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false,
          error: "Invalid JSON in request body" 
        })
      };
    }

    const { 
      action,
      state = 'CA',
      claimType = 'property',
      claimData = {},
      userDeadlines = {}
    } = requestData;

    console.log("Deadline Tracker - Action:", action);

    if (action === 'get-deadlines') {
      return getStateDeadlines(state, claimType, claimData);
    } else if (action === 'check-urgent') {
      return checkUrgentDeadlines(userDeadlines);
    } else if (action === 'get-reminders') {
      return generateDeadlineReminders(userDeadlines);
    } else if (action === 'update-deadline') {
      return updateDeadlineStatus(userDeadlines, requestData.deadlineId, requestData.status);
    } else {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false,
          error: "Invalid action specified" 
        })
      };
    }

  } catch (error) {
    console.error("Error in deadline-tracker:", error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || "Internal server error"
      })
    };
  }
};

function getStateDeadlines(state, claimType, claimData) {
  const stateDeadlines = {
    CA: {
      property: {
        'Notice of Claim': {
          deadline: 'Immediately',
          description: 'Report loss to insurance company',
          importance: 'critical',
          consequences: 'May result in claim denial',
          daysFromLoss: 0
        },
        'Proof of Loss': {
          deadline: '60 days from request',
          description: 'Submit sworn statement of damages',
          importance: 'critical',
          consequences: 'Claim may be denied',
          daysFromLoss: 60
        },
        'Suit Deadline': {
          deadline: '1 year from loss',
          description: 'File lawsuit if claim denied',
          importance: 'critical',
          consequences: 'Permanent loss of legal rights',
          daysFromLoss: 365
        },
        'Appraisal Demand': {
          deadline: 'Any time after denial',
          description: 'Request formal appraisal process',
          importance: 'high',
          consequences: 'May lose right to appraisal',
          daysFromLoss: null
        }
      },
      auto: {
        'Notice of Claim': {
          deadline: 'Immediately',
          description: 'Report accident to insurance company',
          importance: 'critical',
          consequences: 'May result in claim denial',
          daysFromLoss: 0
        },
        'Proof of Loss': {
          deadline: '30 days from request',
          description: 'Submit vehicle damage documentation',
          importance: 'critical',
          consequences: 'Claim may be denied',
          daysFromLoss: 30
        },
        'Suit Deadline': {
          deadline: '2 years from loss',
          description: 'File lawsuit if claim denied',
          importance: 'critical',
          consequences: 'Permanent loss of legal rights',
          daysFromLoss: 730
        }
      }
    },
    TX: {
      property: {
        'Notice of Claim': {
          deadline: 'Immediately',
          description: 'Report loss to insurance company',
          importance: 'critical',
          consequences: 'May result in claim denial',
          daysFromLoss: 0
        },
        'Proof of Loss': {
          deadline: '91 days from request',
          description: 'Submit sworn statement of damages',
          importance: 'critical',
          consequences: 'Claim may be denied',
          daysFromLoss: 91
        },
        'Suit Deadline': {
          deadline: '2 years from loss',
          description: 'File lawsuit if claim denied',
          importance: 'critical',
          consequences: 'Permanent loss of legal rights',
          daysFromLoss: 730
        }
      },
      auto: {
        'Notice of Claim': {
          deadline: 'Immediately',
          description: 'Report accident to insurance company',
          importance: 'critical',
          consequences: 'May result in claim denial',
          daysFromLoss: 0
        },
        'Proof of Loss': {
          deadline: '30 days from request',
          description: 'Submit vehicle damage documentation',
          importance: 'critical',
          consequences: 'Claim may be denied',
          daysFromLoss: 30
        },
        'Suit Deadline': {
          deadline: '2 years from loss',
          description: 'File lawsuit if claim denied',
          importance: 'critical',
          consequences: 'Permanent loss of legal rights',
          daysFromLoss: 730
        }
      }
    },
    FL: {
      property: {
        'Notice of Claim': {
          deadline: 'Immediately',
          description: 'Report loss to insurance company',
          importance: 'critical',
          consequences: 'May result in claim denial',
          daysFromLoss: 0
        },
        'Proof of Loss': {
          deadline: '60 days from request',
          description: 'Submit sworn statement of damages',
          importance: 'critical',
          consequences: 'Claim may be denied',
          daysFromLoss: 60
        },
        'Suit Deadline': {
          deadline: '5 years from loss',
          description: 'File lawsuit if claim denied',
          importance: 'critical',
          consequences: 'Permanent loss of legal rights',
          daysFromLoss: 1825
        }
      },
      auto: {
        'Notice of Claim': {
          deadline: 'Immediately',
          description: 'Report accident to insurance company',
          importance: 'critical',
          consequences: 'May result in claim denial',
          daysFromLoss: 0
        },
        'Proof of Loss': {
          deadline: '30 days from request',
          description: 'Submit vehicle damage documentation',
          importance: 'critical',
          consequences: 'Claim may be denied',
          daysFromLoss: 30
        },
        'Suit Deadline': {
          deadline: '4 years from loss',
          description: 'File lawsuit if claim denied',
          importance: 'critical',
          consequences: 'Permanent loss of legal rights',
          daysFromLoss: 1460
        }
      }
    }
  };

  const deadlines = stateDeadlines[state]?.[claimType] || stateDeadlines.CA[claimType] || {};
  
  // Calculate actual dates based on claim data
  const calculatedDeadlines = calculateDeadlineDates(deadlines, claimData);
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      deadlines: calculatedDeadlines,
      state,
      claimType,
      urgentDeadlines: getUrgentDeadlines(calculatedDeadlines),
      recommendations: getDeadlineRecommendations(calculatedDeadlines)
    })
  };
}

function calculateDeadlineDates(deadlines, claimData) {
  const lossDate = claimData.lossDate ? new Date(claimData.lossDate) : new Date();
  const calculatedDeadlines = {};

  Object.keys(deadlines).forEach(deadlineKey => {
    const deadline = deadlines[deadlineKey];
    const calculatedDeadline = { ...deadline };

    if (deadline.daysFromLoss !== null) {
      const deadlineDate = new Date(lossDate);
      deadlineDate.setDate(deadlineDate.getDate() + deadline.daysFromLoss);
      calculatedDeadline.actualDate = deadlineDate.toISOString().split('T')[0];
      calculatedDeadline.daysRemaining = Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24));
      calculatedDeadline.status = getDeadlineStatus(calculatedDeadline.daysRemaining);
    } else {
      calculatedDeadline.actualDate = 'N/A';
      calculatedDeadline.daysRemaining = null;
      calculatedDeadline.status = 'pending';
    }

    calculatedDeadlines[deadlineKey] = calculatedDeadline;
  });

  return calculatedDeadlines;
}

function getDeadlineStatus(daysRemaining) {
  if (daysRemaining === null) return 'pending';
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= 7) return 'urgent';
  if (daysRemaining <= 30) return 'warning';
  return 'ok';
}

function getUrgentDeadlines(deadlines) {
  return Object.keys(deadlines).filter(key => {
    const deadline = deadlines[key];
    return deadline.status === 'urgent' || deadline.status === 'overdue';
  }).map(key => ({
    name: key,
    ...deadlines[key]
  }));
}

function getDeadlineRecommendations(deadlines) {
  const recommendations = [];
  const urgentCount = Object.values(deadlines).filter(d => d.status === 'urgent' || d.status === 'overdue').length;

  if (urgentCount > 0) {
    recommendations.push({
      priority: 'HIGH',
      message: `${urgentCount} deadline(s) require immediate attention`,
      action: 'Complete urgent deadlines immediately',
      consequences: 'Missing deadlines may result in claim denial'
    });
  }

  const warningCount = Object.values(deadlines).filter(d => d.status === 'warning').length;
  if (warningCount > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      message: `${warningCount} deadline(s) approaching within 30 days`,
      action: 'Prepare documentation and take action soon',
      consequences: 'Plan ahead to avoid last-minute issues'
    });
  }

  if (urgentCount === 0 && warningCount === 0) {
    recommendations.push({
      priority: 'LOW',
      message: 'All deadlines are on track',
      action: 'Continue monitoring and maintain documentation',
      consequences: 'Stay organized to meet all deadlines'
    });
  }

  return recommendations;
}

function checkUrgentDeadlines(userDeadlines) {
  const urgentDeadlines = Object.keys(userDeadlines).filter(key => {
    const deadline = userDeadlines[key];
    return deadline.status === 'urgent' || deadline.status === 'overdue';
  });

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      urgentCount: urgentDeadlines.length,
      urgentDeadlines: urgentDeadlines.map(key => ({
        name: key,
        ...userDeadlines[key]
      })),
      alerts: generateUrgentAlerts(urgentDeadlines.length)
    })
  };
}

function generateUrgentAlerts(urgentCount) {
  const alerts = [];

  if (urgentCount > 0) {
    alerts.push({
      type: 'urgent',
      message: `${urgentCount} deadline(s) require immediate attention`,
      action: 'Review and complete urgent deadlines',
      priority: 'HIGH'
    });
  }

  return alerts;
}

function generateDeadlineReminders(userDeadlines) {
  const reminders = [];
  const currentDate = new Date();

  Object.keys(userDeadlines).forEach(deadlineKey => {
    const deadline = userDeadlines[deadlineKey];
    
    if (deadline.daysRemaining !== null) {
      if (deadline.daysRemaining < 0) {
        reminders.push({
          type: 'overdue',
          message: `${deadlineKey} is overdue by ${Math.abs(deadline.daysRemaining)} days`,
          action: 'Take immediate action to complete this requirement',
          priority: 'CRITICAL'
        });
      } else if (deadline.daysRemaining <= 7) {
        reminders.push({
          type: 'urgent',
          message: `${deadlineKey} is due in ${deadline.daysRemaining} days`,
          action: 'Complete this requirement immediately',
          priority: 'HIGH'
        });
      } else if (deadline.daysRemaining <= 30) {
        reminders.push({
          type: 'warning',
          message: `${deadlineKey} is due in ${deadline.daysRemaining} days`,
          action: 'Prepare documentation and plan completion',
          priority: 'MEDIUM'
        });
      }
    }
  });

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      reminders,
      nextDeadline: getNextDeadline(userDeadlines),
      recommendations: getReminderRecommendations(reminders)
    })
  };
}

function getNextDeadline(userDeadlines) {
  const upcomingDeadlines = Object.keys(userDeadlines).filter(key => {
    const deadline = userDeadlines[key];
    return deadline.daysRemaining !== null && deadline.daysRemaining > 0;
  }).sort((a, b) => userDeadlines[a].daysRemaining - userDeadlines[b].daysRemaining);

  if (upcomingDeadlines.length > 0) {
    const nextDeadline = upcomingDeadlines[0];
    return {
      name: nextDeadline,
      daysRemaining: userDeadlines[nextDeadline].daysRemaining,
      date: userDeadlines[nextDeadline].actualDate
    };
  }

  return null;
}

function getReminderRecommendations(reminders) {
  const criticalCount = reminders.filter(r => r.priority === 'CRITICAL').length;
  const highCount = reminders.filter(r => r.priority === 'HIGH').length;
  const mediumCount = reminders.filter(r => r.priority === 'MEDIUM').length;

  const recommendations = [];

  if (criticalCount > 0) {
    recommendations.push({
      priority: 'CRITICAL',
      message: `${criticalCount} deadline(s) are overdue`,
      action: 'Take immediate action to complete overdue requirements',
      consequences: 'Overdue deadlines may result in claim denial'
    });
  }

  if (highCount > 0) {
    recommendations.push({
      priority: 'HIGH',
      message: `${highCount} deadline(s) are due within 7 days`,
      action: 'Complete these requirements immediately',
      consequences: 'Missing these deadlines may harm your claim'
    });
  }

  if (mediumCount > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      message: `${mediumCount} deadline(s) are due within 30 days`,
      action: 'Plan and prepare for these deadlines',
      consequences: 'Stay organized to meet all requirements'
    });
  }

  if (reminders.length === 0) {
    recommendations.push({
      priority: 'LOW',
      message: 'No urgent deadlines at this time',
      action: 'Continue monitoring and maintain documentation',
      consequences: 'Stay organized to meet all future deadlines'
    });
  }

  return recommendations;
}

function updateDeadlineStatus(userDeadlines, deadlineId, status) {
  const updatedDeadlines = {
    ...userDeadlines,
    [deadlineId]: {
      ...userDeadlines[deadlineId],
      status,
      completedDate: status === 'completed' ? new Date().toISOString() : null
    }
  };

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      message: `Deadline ${deadlineId} updated to ${status}`,
      updatedDeadlines,
      progress: calculateDeadlineProgress(updatedDeadlines)
    })
  };
}

function calculateDeadlineProgress(deadlines) {
  const totalDeadlines = Object.keys(deadlines).length;
  const completedDeadlines = Object.values(deadlines).filter(d => d.status === 'completed').length;
  
  return {
    total: totalDeadlines,
    completed: completedDeadlines,
    percentage: totalDeadlines > 0 ? Math.round((completedDeadlines / totalDeadlines) * 100) : 0
  };
}
