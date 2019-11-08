using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TodosAPI.Models
{
    public class Todo
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonElement("Title")]
        public string TodoTitle { get; set; }

        public string CreationDate { get; set; }

        public bool Done { get; set; }

        public string Priority { get; set; }
    }
}