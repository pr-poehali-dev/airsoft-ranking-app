import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { adminAPI, type Player, type Team } from '@/lib/api';
import Icon from '@/components/ui/icon';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function AdminPanel() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const data = await adminAPI.getAdminData();
      setPlayers(data.players);
      setTeams(data.teams);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось загрузить данные',
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    try {
      await adminAPI.createTeam(name, description);
      toast({
        title: 'Команда создана!',
        description: `Команда ${name} успешно добавлена`,
      });
      loadData();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать команду',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const teamId = parseInt(formData.get('team_id') as string);
    const playerId = parseInt(formData.get('player_id') as string);

    try {
      await adminAPI.addPlayerToTeam(teamId, playerId);
      toast({
        title: 'Игрок добавлен!',
        description: 'Игрок успешно добавлен в команду',
      });
      loadData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось добавить игрока',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBanPlayer = async (playerId: number, banned: boolean) => {
    try {
      await adminAPI.banPlayer(playerId, banned);
      toast({
        title: banned ? 'Игрок заблокирован' : 'Блокировка снята',
        description: 'Статус игрока обновлен',
      });
      loadData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось обновить статус',
      });
    }
  };

  const handleCreateMatch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      match_type: formData.get('match_type') as string,
      match_date: formData.get('match_date') as string,
      max_players: formData.get('max_players') ? parseInt(formData.get('max_players') as string) : undefined,
      team1_id: formData.get('team1_id') ? parseInt(formData.get('team1_id') as string) : undefined,
      team2_id: formData.get('team2_id') ? parseInt(formData.get('team2_id') as string) : undefined,
    };

    try {
      await adminAPI.createMatch(data);
      toast({
        title: 'Матч создан!',
        description: `Матч ${data.title} успешно добавлен`,
      });
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать матч',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 flex-wrap">
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Icon name="Plus" size={16} className="mr-2" />
              Создать команду
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать команду</DialogTitle>
              <DialogDescription>Добавьте новую команду в систему</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название команды</Label>
                <Input id="name" name="name" required placeholder="Альфа" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea id="description" name="description" placeholder="Описание команды..." />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Создание...' : 'Создать команду'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Icon name="UserPlus" size={16} className="mr-2" />
              Добавить в команду
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить игрока в команду</DialogTitle>
              <DialogDescription>Назначьте игрока в команду</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddToTeam} className="space-y-4">
              <div className="space-y-2">
                <Label>Команда</Label>
                <Select name="team_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите команду" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Игрок</Label>
                <Select name="player_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите игрока" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((player) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.name} ({player.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Добавление...' : 'Добавить'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Icon name="Trophy" size={16} className="mr-2" />
              Создать матч
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Создать матч</DialogTitle>
              <DialogDescription>Запланируйте новый матч</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Название матча</Label>
                  <Input id="title" name="title" required placeholder="Турнир №5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="match_type">Тип матча</Label>
                  <Select name="match_type" defaultValue="Турнир">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Турнир">Турнир</SelectItem>
                      <SelectItem value="Тренировка">Тренировка</SelectItem>
                      <SelectItem value="Ранговый">Ранговый</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="match_date">Дата и время</Label>
                  <Input id="match_date" name="match_date" type="datetime-local" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_players">Макс. игроков</Label>
                  <Input id="max_players" name="max_players" type="number" placeholder="20" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Команда 1 (опционально)</Label>
                  <Select name="team1_id">
                    <SelectTrigger>
                      <SelectValue placeholder="Не выбрано" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Команда 2 (опционально)</Label>
                  <Select name="team2_id">
                    <SelectTrigger>
                      <SelectValue placeholder="Не выбрано" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Создание...' : 'Создать матч'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Управление игроками</CardTitle>
          <CardDescription>Список всех зарегистрированных игроков</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Имя</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Команда</TableHead>
                <TableHead className="text-right">Рейтинг</TableHead>
                <TableHead className="text-right">Матчи</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell className="text-muted-foreground">{player.email}</TableCell>
                  <TableCell>{player.team || '-'}</TableCell>
                  <TableCell className="text-right">{player.rating}</TableCell>
                  <TableCell className="text-right">{player.matches_played}</TableCell>
                  <TableCell>
                    {player.is_admin && <Badge variant="outline">Админ</Badge>}
                    {player.is_banned && <Badge variant="destructive">Бан</Badge>}
                    {!player.is_admin && !player.is_banned && <Badge>Активен</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBanPlayer(player.id, !player.is_banned)}
                    >
                      <Icon name={player.is_banned ? 'UserCheck' : 'Ban'} size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
