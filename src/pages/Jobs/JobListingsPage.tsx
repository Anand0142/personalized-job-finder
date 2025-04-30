
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, MapPin, Calendar } from 'lucide-react';
import { useResume } from '@/contexts/ResumeContext';
import { motion } from 'framer-motion';

export default function JobListingsPage() {
  const { recommendedJobs = [] } = useResume();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">Recommended Jobs</h1>
        <p className="text-gray-500">Jobs matching your profile and interests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendedJobs && recommendedJobs.length > 0 ? (
          recommendedJobs.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span>{job.title}</span>
                    <span className="text-sm font-normal text-gray-500">{job.salary}</span>
                  </CardTitle>
                  <CardDescription>{job.company}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>Posted: {new Date(job.postedDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {job.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="bg-appPurple/10 text-appPurple px-2 py-1 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <Button className="w-full mt-4 bg-appPurple hover:bg-appSecondary">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Apply Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="col-span-2 text-center py-10">
            <p className="text-gray-500">No job recommendations available. Please check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
