import React from 'react';
import { Award, Users, Globe, Heart } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h1 className="text-3xl font-bold text-primary-950 mb-6">About Solewaale</h1>
            <p className="text-base text-gray-600 max-w-3xl mx-auto">
              We specialize in curating premium imported footwear from around the world, bringing you exceptional quality 
              and style at competitive prices. Our commitment to excellence ensures every pair meets our high standards.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <img
                src="/assets/hero-shoes.jpg"
                alt="Our Story"
                className="rounded-lg shadow-xl"
              />
            </div>
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Founded in 2024, Solewaale emerged from a vision to bridge the gap between quality footwear and affordability. 
                  Our founders recognized the need for premium imported shoes that combine international standards with accessible pricing.
                </p>
                <p>
                  We have established partnerships with trusted suppliers worldwide who bring decades of expertise in footwear 
                  manufacturing. Every product undergoes rigorous quality testing to ensure it meets our exacting standards before 
                  reaching our customers.
                </p>
                <p>
                  From our initial collection to serving thousands of satisfied customers across India, we have maintained our 
                  commitment to excellence. Our dedicated team continues to expand our offerings while preserving the quality 
                  and service that define our brand.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 animate-fade-in">Our Values</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto animate-fade-in">
              These core principles guide everything we do, from product curation to customer service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Award,
                title: 'Excellence',
                description: 'We maintain the highest standards in product selection and quality assurance for every item we offer.'
              },
              {
                icon: Heart,
                title: 'Passion',
                description: 'Our dedication to footwear excellence drives us to continuously seek the finest products for our customers.'
              },
              {
                icon: Users,
                title: 'Community',
                description: 'We build lasting relationships with our customers through exceptional service and genuine care.'
              },
              {
                icon: Globe,
                title: 'Sustainability',
                description: 'We are committed to responsible business practices that benefit our community and environment.'
              }
            ].map((value, index) => (
              <div key={index} className="text-center animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-16 h-16 bg-primary-950 rounded-full flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold text-white mb-4 animate-fade-in">
              Trusted Worldwide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { number: '10K+', label: 'Happy Customers' },
              { number: '500+', label: 'Premium Shoes' },
              { number: '50+', label: 'Countries Served' },
              { number: '4.9', label: 'Average Rating' }
            ].map((stat, index) => (
              <div key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-primary-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 animate-fade-in">Meet Our Team</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto animate-fade-in">
              The passionate people behind Solewaale who work tirelessly to bring you the best footwear.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                name: 'Pratik Hosmani',
                role: 'Founder & CEO',
                image: '/assets/team-member-1.PNG'
              },
              {
                name: 'Omkar Tidme',
                role: 'Founder & CFO',
                image: '/assets/team-member-2.png'
              }
            ].map((member, index) => (
              <div key={index} className="text-center animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto mb-6 object-cover"
                />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;