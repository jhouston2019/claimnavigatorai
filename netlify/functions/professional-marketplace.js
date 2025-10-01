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
      location, 
      claimType, 
      claimAmount, 
      professionalType,
      state
    } = requestData;

    console.log("Searching professional marketplace for:", professionalType, "in", location);

    // Mock professional database (in production, this would query a real database)
    const professionals = getProfessionalDatabase();
    
    // Filter professionals based on criteria
    let filteredProfessionals = professionals;

    if (location) {
      filteredProfessionals = filteredProfessionals.filter(p => 
        p.serviceAreas.includes(location) || p.serviceAreas.includes('Nationwide')
      );
    }

    if (professionalType) {
      filteredProfessionals = filteredProfessionals.filter(p => 
        p.type === professionalType
      );
    }

    if (claimType) {
      filteredProfessionals = filteredProfessionals.filter(p => 
        p.specialties.includes(claimType)
      );
    }

    if (state) {
      filteredProfessionals = filteredProfessionals.filter(p => 
        p.licensedStates.includes(state) || p.licensedStates.includes('All States')
      );
    }

    // Sort by rating and experience
    filteredProfessionals.sort((a, b) => {
      const scoreA = (a.rating * 0.7) + (a.experienceYears * 0.3);
      const scoreB = (b.rating * 0.7) + (b.experienceYears * 0.3);
      return scoreB - scoreA;
    });

    // Add matching score
    const professionalsWithScore = filteredProfessionals.map(professional => ({
      ...professional,
      matchScore: calculateMatchScore(professional, requestData)
    }));

    // Generate recommendations
    const recommendations = generateProfessionalRecommendations({
      professionals: professionalsWithScore,
      claimType,
      claimAmount,
      professionalType
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        professionals: professionalsWithScore.slice(0, 10), // Return top 10
        recommendations,
        totalFound: professionalsWithScore.length,
        searchCriteria: {
          location,
          claimType,
          claimAmount,
          professionalType,
          state
        },
        generatedAt: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error("Error in professional-marketplace:", error);
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

function getProfessionalDatabase() {
  return [
    {
      id: 'pa001',
      name: 'John Smith Public Adjusting',
      type: 'public_adjuster',
      specialties: ['property', 'fire', 'water_damage'],
      rating: 4.8,
      experienceYears: 15,
      location: 'California',
      serviceAreas: ['California', 'Nevada'],
      licensedStates: ['California', 'Nevada'],
      feeStructure: '10% of recovery',
      contactInfo: {
        phone: '(555) 123-4567',
        email: 'john@smithpa.com',
        website: 'www.smithpa.com'
      },
      description: 'Specializes in residential and commercial property claims with 15 years experience.',
      recentCases: 150,
      averageRecovery: 1.3
    },
    {
      id: 'att001',
      name: 'Legal Claims Associates',
      type: 'attorney',
      specialties: ['property', 'bad_faith', 'commercial'],
      rating: 4.9,
      experienceYears: 20,
      location: 'Texas',
      serviceAreas: ['Texas', 'Nationwide'],
      licensedStates: ['Texas', 'California', 'Florida'],
      feeStructure: '33% contingency',
      contactInfo: {
        phone: '(555) 234-5678',
        email: 'info@legalclaims.com',
        website: 'www.legalclaims.com'
      },
      description: 'Insurance litigation specialists with focus on bad faith claims.',
      recentCases: 75,
      averageRecovery: 1.8
    },
    {
      id: 'pa002',
      name: 'Metro Adjusting Services',
      type: 'public_adjuster',
      specialties: ['property', 'flood', 'storm'],
      rating: 4.6,
      experienceYears: 12,
      location: 'Florida',
      serviceAreas: ['Florida', 'Georgia', 'South Carolina'],
      licensedStates: ['Florida', 'Georgia', 'South Carolina'],
      feeStructure: '10% of recovery',
      contactInfo: {
        phone: '(555) 345-6789',
        email: 'contact@metroadjusting.com',
        website: 'www.metroadjusting.com'
      },
      description: 'Expert in hurricane and flood damage claims.',
      recentCases: 200,
      averageRecovery: 1.4
    },
    {
      id: 'exp001',
      name: 'Construction Experts LLC',
      type: 'expert',
      specialties: ['property', 'construction', 'building_damage'],
      rating: 4.7,
      experienceYears: 25,
      location: 'New York',
      serviceAreas: ['Nationwide'],
      licensedStates: ['All States'],
      feeStructure: '$200/hour',
      contactInfo: {
        phone: '(555) 456-7890',
        email: 'info@constructionexperts.com',
        website: 'www.constructionexperts.com'
      },
      description: 'Licensed contractors providing expert opinions on construction damage.',
      recentCases: 300,
      averageRecovery: 1.2
    },
    {
      id: 'att002',
      name: 'Health Claims Legal Group',
      type: 'attorney',
      specialties: ['health', 'disability', 'life_insurance'],
      rating: 4.8,
      experienceYears: 18,
      location: 'Illinois',
      serviceAreas: ['Nationwide'],
      licensedStates: ['Illinois', 'California', 'New York', 'Texas'],
      feeStructure: '33% contingency',
      contactInfo: {
        phone: '(555) 567-8901',
        email: 'help@healthclaimslegal.com',
        website: 'www.healthclaimslegal.com'
      },
      description: 'Specializes in health insurance and disability claim appeals.',
      recentCases: 120,
      averageRecovery: 2.1
    },
    {
      id: 'pa003',
      name: 'Auto Claims Specialists',
      type: 'public_adjuster',
      specialties: ['auto', 'commercial_auto', 'motorcycle'],
      rating: 4.5,
      experienceYears: 10,
      location: 'Arizona',
      serviceAreas: ['Arizona', 'New Mexico', 'Nevada'],
      licensedStates: ['Arizona', 'New Mexico', 'Nevada'],
      feeStructure: '10% of recovery',
      contactInfo: {
        phone: '(555) 678-9012',
        email: 'info@autoclaimsspecialists.com',
        website: 'www.autoclaimsspecialists.com'
      },
      description: 'Auto insurance claim specialists with focus on total loss and diminished value.',
      recentCases: 180,
      averageRecovery: 1.3
    }
  ];
}

function calculateMatchScore(professional, criteria) {
  let score = 0;
  
  // Location match
  if (criteria.location && professional.serviceAreas.includes(criteria.location)) {
    score += 30;
  } else if (professional.serviceAreas.includes('Nationwide')) {
    score += 20;
  }
  
  // Claim type match
  if (criteria.claimType && professional.specialties.includes(criteria.claimType)) {
    score += 25;
  }
  
  // Professional type match
  if (criteria.professionalType && professional.type === criteria.professionalType) {
    score += 25;
  }
  
  // Rating bonus
  score += professional.rating * 4;
  
  // Experience bonus
  score += Math.min(professional.experienceYears * 0.5, 10);
  
  return Math.min(score, 100);
}

function generateProfessionalRecommendations(data) {
  const recommendations = [];
  
  if (data.claimAmount > 100000) {
    recommendations.push({
      priority: "HIGH",
      category: "High-Value Claims",
      title: "High-Value Claim Recommendation",
      description: "For claims over $100,000, professional representation is strongly recommended.",
      actions: [
        "Consider hiring a public adjuster or attorney",
        "Look for professionals with experience in high-value claims",
        "Verify credentials and track record"
      ]
    });
  }
  
  if (data.claimType === 'health') {
    recommendations.push({
      priority: "HIGH",
      category: "Health Claims",
      title: "Health Insurance Specialists",
      description: "Health insurance claims have specific procedures and deadlines.",
      actions: [
        "Look for attorneys specializing in health insurance",
        "Verify experience with your specific type of claim",
        "Check for success with similar cases"
      ]
    });
  }
  
  if (data.claimType === 'property') {
    recommendations.push({
      priority: "MEDIUM",
      category: "Property Claims",
      title: "Property Damage Specialists",
      description: "Property claims benefit from professionals with construction expertise.",
      actions: [
        "Consider public adjusters with construction background",
        "Look for experts in your specific type of damage",
        "Verify licensing in your state"
      ]
    });
  }
  
  recommendations.push({
    priority: "LOW",
    category: "General",
    title: "General Selection Criteria",
    description: "Important factors to consider when selecting a professional.",
    actions: [
      "Check licensing and credentials",
      "Review client testimonials and ratings",
      "Understand fee structures and payment terms",
      "Verify experience with your type of claim",
      "Ask about recent similar cases"
    ]
  });
  
  return recommendations;
}
