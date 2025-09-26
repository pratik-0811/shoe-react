import React from 'react';
import { Award, Users, Globe, Heart } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold text-primary-950 mb-6">About Solewaale</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We believe in creating exceptional experiences through carefully curated footwear 
              that combines timeless style with modern comfort and performance.
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
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Founded in 2020, Solewaale began as a passion project to bring together the world's 
                  most innovative and comfortable footwear in one place. We started with a simple belief: 
                  that every step should be both stylish and comfortable.
                </p>
                <p>
                  Our team travels the globe to discover shoe designers, craftsmen, and brands who share 
                  our commitment to excellence. Every pair of shoes in our collection is chosen for its 
                  superior comfort, innovative design, and lasting durability.
                </p>
                <p>
                  Today, we're proud to serve thousands of customers worldwide, helping them find 
                  the perfect shoes that enhance their performance and reflect their personal style.
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 animate-fade-in">Our Values</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-fade-in">
              These core principles guide everything we do, from product curation to customer service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Award,
                title: 'Excellence',
                description: 'We never compromise on quality and craftsmanship in our footwear selection.'
              },
              {
                icon: Heart,
                title: 'Passion',
                description: 'Every shoe we choose reflects our love for beautiful, functional footwear design.'
              },
              {
                icon: Users,
                title: 'Community',
                description: 'We build lasting relationships with our customers and partners worldwide.'
              },
              {
                icon: Globe,
                title: 'Sustainability',
                description: 'We prioritize sustainable footwear and partners who care about our planet\'s future.'
              }
            ].map((value, index) => (
              <div key={index} className="text-center animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-16 h-16 bg-primary-950 rounded-full flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{value.title}</h3>
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
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 animate-fade-in">
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
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.number}</div>
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 animate-fade-in">Meet Our Team</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-fade-in">
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
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{member.name}</h3>
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