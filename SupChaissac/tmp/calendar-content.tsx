          <TabsContent value="calendar">
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </Button>
                    <div className="text-lg font-semibold">
                      {format(currentWeek, 'MMMM yyyy', { locale: fr })}
                      <div className="text-sm text-muted-foreground">
                        {generateWeekDays().length > 0 && `Semaine du ${format(generateWeekDays()[0], 'd')} au ${format(generateWeekDays()[4], 'd MMMM', { locale: fr })}`}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={goToNextWeek}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Aujourd'hui
                  </Button>
                </div>
              
                <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
                  <div className="grid grid-cols-6 border-b">
                    <div className="p-2 text-center font-medium border-r"></div>
                    {generateWeekDays().map((day, index) => (
                      <div 
                        key={index} 
                        className={`p-2 text-center font-medium ${isToday(day) ? 'bg-blue-50' : ''}`}
                      >
                        <div>{format(day, 'EEEE', { locale: fr })}</div>
                        <div className="text-sm">{format(day, 'd MMMM', { locale: fr })}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="divide-y">
                    {getTimeSlots().map((slot, slotIndex) => (
                      <div key={slotIndex} className="grid grid-cols-6">
                        <div className={`p-2 text-center border-r ${slot.morning ? 'bg-blue-50' : 'bg-amber-50'}`}>
                          <div className="font-medium">{slot.id}</div>
                          <div className="text-xs">{slot.label}</div>
                        </div>
                        
                        {generateWeekDays().map((day, dayIndex) => {
                          const sessionsForSlot = getSessionsForDay(day, slot.id);
                          
                          return (
                            <div 
                              key={dayIndex} 
                              className={`p-2 min-h-[80px] border-r last:border-r-0 relative ${isToday(day) ? 'bg-blue-50/30' : ''}`}
                              onClick={() => openSessionForm(day, slot.id)}
                            >
                              {sessionsForSlot.length > 0 ? (
                                <div className="space-y-1">
                                  {sessionsForSlot.map((session, sessionIndex) => (
                                    <div 
                                      key={sessionIndex} 
                                      className={`p-1 rounded text-xs cursor-pointer ${
                                        session.type === 'RCD' ? 'bg-purple-600 text-white' : 
                                        session.type === 'DEVOIRS_FAITS' ? 'bg-blue-600 text-white' : 
                                        'bg-amber-500 text-white'
                                      }`}
                                    >
                                      {session.type === 'RCD' && (
                                        <div>
                                          <div className="font-medium">RCD - {session.className}</div>
                                          <div className="truncate">{session.replacedTeacherName}</div>
                                        </div>
                                      )}
                                      {session.type === 'DEVOIRS_FAITS' && (
                                        <div>
                                          <div className="font-medium">Devoirs Faits - {session.gradeLevel}</div>
                                          <div>{session.studentCount} élèves</div>
                                        </div>
                                      )}
                                      {session.type === 'AUTRE' && (
                                        <div>
                                          <div className="font-medium">Autre</div>
                                          <div className="truncate">{session.description}</div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-full opacity-0 hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="sm" className="text-xs">Ajouter</Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-6 flex justify-center">
                  <Button onClick={() => openSessionForm()}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Déclarer une nouvelle séance
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>