from api import db


class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(30))
    description = db.Column(db.String(30))
    date = db.Column(db.Date)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "date": str(self.date.strftime("%d-%m-%Y")),
        }