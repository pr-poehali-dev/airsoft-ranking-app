import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import AuthDialog from '@/components/AuthDialog';
import AvatarUpload from '@/components/AvatarUpload';
import { getStoredUser, getCurrentUser, logout, type User } from '@/lib/auth';

const mockPlayers = [
  { id: 1, name: 'Александр "Снайпер" Иванов', team: 'Альфа', rating: 2847, matches: 156, wins: 128, kills: 1249, deaths: 387, kd: 3.23, status: 'active' },
  { id: 2, name: 'Дмитрий "Шторм" Петров', team: 'Браво', rating: 2756, matches: 143, wins: 115, kills: 1156, deaths: 421, kd: 2.75, status: 'active' },
  { id: 3, name: 'Сергей "Призрак" Смирнов', team: 'Альфа', rating: 2698, matches: 138, wins: 109, kills: 1087, deaths: 398, kd: 2.73, status: 'active' },
  { id: 4, name: 'Михаил "Танк" Козлов', team: 'Чарли', rating: 2634, matches: 149, wins: 117, kills: 1034, deaths: 456, kd: 2.27, status: 'active' },
  { id: 5, name: 'Игорь "Ястреб" Морозов', team: 'Дельта', rating: 2589, matches: 132, wins: 98, kills: 978, deaths: 389, kd: 2.51, status: 'active' },
  { id: 6, name: 'Андрей "Волк" Соколов', team: 'Браво', rating: 2512, matches: 127, wins: 89, kills: 891, deaths: 412, kd: 2.16, status: 'blocked' },
];

const mockTeams = [
  { id: 1, name: 'Альфа', rating: 8945, players: 12, matches: 89, wins: 67, winRate: 75.3 },
  { id: 2, name: 'Браво', rating: 8723, players: 15, matches: 92, wins: 64, winRate: 69.6 },
  { id: 3, name: 'Чарли', rating: 8456, players: 10, matches: 78, wins: 54, winRate: 69.2 },
  { id: 4, name: 'Дельта', rating: 8234, players: 11, matches: 81, wins: 52, winRate: 64.2 },
];

const mockMatches = [
  { id: 1, date: '2024-12-24', type: 'Турнир', teams: ['Альфа', 'Браво'], winner: 'Альфа', score: '15-12', duration: '45 мин' },
  { id: 2, date: '2024-12-23', type: 'Тренировка', teams: ['Чарли', 'Дельта'], winner: 'Чарли', score: '10-8', duration: '32 мин' },
  { id: 3, date: '2024-12-22', type: 'Турнир', teams: ['Браво', 'Дельта'], winner: 'Браво', score: '13-9', duration: '38 мин' },
  { id: 4, date: '2024-12-21', type: 'Ранговый', teams: ['Альфа', 'Чарли'], winner: 'Альфа', score: '12-11', duration: '41 мин' },
];

const Index = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('players');
  const [user, setUser] = useState<User | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      }
    };
    loadUser();
  }, []);

  const handleAuthSuccess = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setProfileOpen(false);
  };

  const handleAvatarUpload = (avatarUrl: string) => {
    if (user) {
      setUser({ ...user, avatar_url: avatarUrl });
    }
  };

  const player = mockPlayers.find(p => p.id === selectedPlayer);

  if (selectedPlayer && player) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => setSelectedPlayer(null)}
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад к рейтингу
          </Button>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {player.name.split(' ')[0][0]}{player.name.split(' ')[1][0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-3xl">{player.name}</CardTitle>
                      <CardDescription className="text-lg mt-1">
                        Команда: {player.team}
                      </CardDescription>
                    </div>
                  </div>
                  {player.status === 'blocked' && (
                    <Badge variant="destructive" className="text-sm">
                      <Icon name="Ban" size={14} className="mr-1" />
                      Заблокирован
                    </Badge>
                  )}
                </div>
              </CardHeader>
            </Card>

            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Рейтинг</CardDescription>
                  <CardTitle className="text-3xl text-primary">{player.rating}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Матчей</CardDescription>
                  <CardTitle className="text-3xl">{player.matches}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Побед</CardDescription>
                  <CardTitle className="text-3xl">{player.wins}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>K/D Ratio</CardDescription>
                  <CardTitle className="text-3xl">{player.kd}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Детальная статистика</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Процент побед</span>
                    <span className="text-sm font-medium">{((player.wins / player.matches) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(player.wins / player.matches) * 100} className="h-2" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Eliminations</span>
                      <span className="font-medium">{player.kills}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Deaths</span>
                      <span className="font-medium">{player.deaths}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg. Eliminations/Match</span>
                      <span className="font-medium">{(player.kills / player.matches).toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg. Deaths/Match</span>
                      <span className="font-medium">{(player.deaths / player.matches).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Последние матчи</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockMatches.slice(0, 5).map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <Icon name="Trophy" size={20} className="text-muted-foreground" />
                        <div>
                          <div className="font-medium">{match.teams[0]} vs {match.teams[1]}</div>
                          <div className="text-sm text-muted-foreground">{match.date} • {match.type}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{match.score}</div>
                        <div className="text-sm text-muted-foreground">{match.duration}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="Target" size={32} className="text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Airsoft Rating</h1>
                <p className="text-sm text-muted-foreground">Система рейтинга игроков</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <Button variant="outline" onClick={() => setProfileOpen(true)}>
                  <Avatar className="h-6 w-6 mr-2">
                    {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                    <AvatarFallback className="text-xs">
                      {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {user.name}
                </Button>
              ) : (
                <Button onClick={() => setAuthDialogOpen(true)}>
                  <Icon name="LogIn" size={18} className="mr-2" />
                  Войти
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen}
        onSuccess={handleAuthSuccess}
      />

      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Мой профиль</SheetTitle>
            <SheetDescription>
              Управление аватаром и настройками
            </SheetDescription>
          </SheetHeader>
          
          {user && (
            <div className="mt-6 space-y-6">
              <AvatarUpload 
                currentAvatar={user.avatar_url}
                userName={user.name}
                onUploadSuccess={handleAvatarUpload}
              />
              
              <div className="space-y-3 pt-4 border-t">
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{user.email}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Имя</div>
                  <div className="font-medium">{user.name}</div>
                </div>
                {user.nickname && (
                  <div>
                    <div className="text-sm text-muted-foreground">Никнейм</div>
                    <div className="font-medium">{user.nickname}</div>
                  </div>
                )}
                {user.team && (
                  <div>
                    <div className="text-sm text-muted-foreground">Команда</div>
                    <div className="font-medium">{user.team}</div>
                  </div>
                )}
              </div>

              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleLogout}
              >
                <Icon name="LogOut" size={16} className="mr-2" />
                Выйти
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="players" className="gap-2">
              <Icon name="Users" size={16} />
              Игроки
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2">
              <Icon name="Shield" size={16} />
              Команды
            </TabsTrigger>
            <TabsTrigger value="matches" className="gap-2">
              <Icon name="History" size={16} />
              Матчи
            </TabsTrigger>
          </TabsList>

          <TabsContent value="players" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Рейтинг игроков</CardTitle>
                <CardDescription>Топ игроков по рейтингу за текущий сезон</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Игрок</TableHead>
                      <TableHead>Команда</TableHead>
                      <TableHead className="text-right">Рейтинг</TableHead>
                      <TableHead className="text-right">Матчи</TableHead>
                      <TableHead className="text-right">Побеги</TableHead>
                      <TableHead className="text-right">K/D</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockPlayers.map((player, index) => (
                      <TableRow 
                        key={player.id}
                        className={player.status === 'blocked' ? 'opacity-60' : ''}
                      >
                        <TableCell className="font-medium">
                          {index === 0 && <span className="text-yellow-600">🥇</span>}
                          {index === 1 && <span className="text-gray-400">🥈</span>}
                          {index === 2 && <span className="text-orange-600">🥉</span>}
                          {index > 2 && index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {player.name.split(' ')[0][0]}{player.name.split(' ')[1][0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{player.name}</span>
                            {player.status === 'blocked' && (
                              <Badge variant="destructive" className="text-xs">
                                <Icon name="Ban" size={10} className="mr-1" />
                                Блок
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{player.team}</TableCell>
                        <TableCell className="text-right font-bold text-primary">{player.rating}</TableCell>
                        <TableCell className="text-right">{player.matches}</TableCell>
                        <TableCell className="text-right">{player.wins}</TableCell>
                        <TableCell className="text-right">{player.kd}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedPlayer(player.id)}
                          >
                            <Icon name="Eye" size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Рейтинг команд</CardTitle>
                <CardDescription>Командные показатели за текущий сезон</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Команда</TableHead>
                      <TableHead className="text-right">Рейтинг</TableHead>
                      <TableHead className="text-right">Игроки</TableHead>
                      <TableHead className="text-right">Матчи</TableHead>
                      <TableHead className="text-right">Побеги</TableHead>
                      <TableHead className="text-right">Win Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTeams.map((team, index) => (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">
                          {index === 0 && <span className="text-yellow-600">🥇</span>}
                          {index === 1 && <span className="text-gray-400">🥈</span>}
                          {index === 2 && <span className="text-orange-600">🥉</span>}
                          {index > 2 && index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon name="Shield" size={20} className="text-primary" />
                            <span className="font-medium">{team.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">{team.rating}</TableCell>
                        <TableCell className="text-right">{team.players}</TableCell>
                        <TableCell className="text-right">{team.matches}</TableCell>
                        <TableCell className="text-right">{team.wins}</TableCell>
                        <TableCell className="text-right">{team.winRate}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>История матчей</CardTitle>
                <CardDescription>Последние проведенные игры</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockMatches.map((match) => (
                    <div key={match.id} className="p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Icon name="Swords" size={24} className="text-primary" />
                          <div>
                            <div className="font-medium text-lg">
                              {match.teams[0]} vs {match.teams[1]}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {match.date} • {match.type} • {match.duration}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{match.score}</div>
                          <Badge variant="outline" className="mt-1">
                            <Icon name="Trophy" size={12} className="mr-1" />
                            {match.winner}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;